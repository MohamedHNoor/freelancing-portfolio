import { describe, expect, it } from "vitest";
import { getDb } from "@/db";
import { NotFoundError } from "@/lib/permissions";
import { milestoneInputSchema } from "@/lib/validation/milestone";
import { getProjectView, listClientProjects, listProjectClients, listProjects } from "@/server/queries/projects";
import { cancelMilestone, createMilestone } from "@/server/services/payment-plan";
import { changeProjectStatus } from "@/server/services/projects";
import { OWNER_A, OWNER_B } from "../../support/database";
import { seedClient, seedProject } from "../../support/fixtures";

const fixed = (amount: string) =>
  milestoneInputSchema.parse({ name: "Build", billingTrigger: "on_completion", pricingMode: "fixed", amount });

/** Sets distinct creation times, so "newest first" does not depend on insert speed. */
async function createdAt(projectId: string, iso: string) {
  await getDb().project.update({ where: { id: projectId }, data: { createdAt: new Date(iso) } });
}

describe("listProjects", () => {
  it("lists only the caller's projects, newest first, with client and plan summary", async () => {
    const older = await seedProject(OWNER_A, { name: "Older", preset: { kind: "deposit_30", count: 2 } });
    const newer = await seedProject(OWNER_A, { name: "Newer" });
    await seedProject(OWNER_B, { name: "Not mine" });
    await createdAt(older.projectId, "2026-01-01T00:00:00Z");
    await createdAt(newer.projectId, "2026-02-01T00:00:00Z");

    const rows = await listProjects(OWNER_A, { status: "all" });
    expect(rows.map(({ name }) => name)).toEqual(["Newer", "Older"]);
    expect(rows[1]).toEqual({
      id: older.projectId,
      name: "Older",
      status: "draft",
      currency: "NZD",
      totalAmountMinor: 5000000,
      client: { id: older.clientId, displayName: "Aroha Ngata" },
      plan: { allocated: 5000000, unallocated: 0, balanced: true },
    });
    expect(rows[0].plan).toEqual({ allocated: 0, unallocated: 5000000, balanced: false });
  });

  it("filters by one status", async () => {
    const draft = await seedProject(OWNER_A, { name: "Draft" });
    const active = await seedProject(OWNER_A, { name: "Active", preset: { kind: "fixed", count: 1 } });
    await changeProjectStatus(OWNER_A, active.projectId, "activate");

    expect((await listProjects(OWNER_A, { status: "active" })).map(({ id }) => id)).toEqual([active.projectId]);
    expect((await listProjects(OWNER_A, { status: "draft" })).map(({ id }) => id)).toEqual([draft.projectId]);
    expect(await listProjects(OWNER_A, { status: "cancelled" })).toEqual([]);
  });

  it("gives another owner nothing", async () => {
    await seedProject(OWNER_A);
    expect(await listProjects(OWNER_B, { status: "all" })).toEqual([]);
  });
});

describe("listClientProjects", () => {
  it("lists one client's projects only", async () => {
    const { clientId, projectId } = await seedProject(OWNER_A, { name: "Theirs" });
    await seedProject(OWNER_A, { name: "Someone else's" });
    expect((await listClientProjects(OWNER_A, clientId)).map(({ id }) => id)).toEqual([projectId]);
  });

  it("raises NotFound for another owner's client", async () => {
    const { clientId } = await seedProject(OWNER_A);
    await expect(listClientProjects(OWNER_B, clientId)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("listProjectClients", () => {
  it("offers the caller's active clients only, by name, with their currency", async () => {
    const id = await seedClient(OWNER_A);
    await seedClient(OWNER_A, { archivedAt: new Date() });
    await seedClient(OWNER_B);
    expect(await listProjectClients(OWNER_A)).toEqual([{ id, displayName: "Aroha Ngata", defaultCurrency: "NZD" }]);
  });
});

describe("getProjectView", () => {
  it("returns the plan in position order with derived figures", async () => {
    const { clientId, projectId } = await seedProject(OWNER_A, {
      startDate: "2026-03-01",
      preset: { kind: "deposit_30", count: 2 },
    });

    const view = await getProjectView(OWNER_A, projectId);
    expect(view).toMatchObject({
      id: projectId,
      status: "draft",
      currency: "NZD",
      totalAmountMinor: 5000000,
      startDate: "2026-03-01",
      expectedEndDate: null,
      client: { id: clientId, displayName: "Aroha Ngata", archived: false },
      plan: { allocated: 5000000, unallocated: 0, balanced: true },
      figures: { paid: 0, outstanding: 5000000, requested: 0, paymentProgress: 0 },
      developmentProgress: 0,
      canActivate: true,
      canComplete: false,
    });
    expect(view.milestones.map((m) => [m.name, m.billingTrigger, m.percentageBps, m.amountMinor])).toEqual([
      ["Deposit", "upfront", 3000, 1500000],
      ["Milestone 1", "on_completion", 3500, 1750000],
      ["Milestone 2", "on_completion", 3500, 1750000],
    ]);
  });

  it("cannot activate an empty or unbalanced draft", async () => {
    const { projectId } = await seedProject(OWNER_A);
    expect((await getProjectView(OWNER_A, projectId)).canActivate).toBe(false);

    await createMilestone(OWNER_A, projectId, fixed("10,000.00"));
    const view = await getProjectView(OWNER_A, projectId);
    expect(view.plan).toEqual({ allocated: 1000000, unallocated: 4000000, balanced: false });
    expect(view.canActivate).toBe(false);
  });

  it("leaves cancelled milestones out of the plan summary", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 2 } });
    const [first] = (await getProjectView(OWNER_A, projectId)).milestones;
    await cancelMilestone(OWNER_A, first.id);

    const view = await getProjectView(OWNER_A, projectId);
    expect(view.milestones[0].status).toBe("cancelled");
    expect(view.plan).toEqual({ allocated: 2500000, unallocated: 2500000, balanced: false });
  });

  it("cannot complete an active project while a milestone is still open", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 1 } });
    await changeProjectStatus(OWNER_A, projectId, "activate");
    const view = await getProjectView(OWNER_A, projectId);
    expect(view.canActivate).toBe(false);
    expect(view.canComplete).toBe(false);
  });

  it("raises NotFound for another owner's, a missing and a malformed id", async () => {
    const { projectId } = await seedProject(OWNER_A);
    await expect(getProjectView(OWNER_B, projectId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getProjectView(OWNER_A, "8d1b4a52-0d3c-4b5e-9a3f-1c2d3e4f5a6b")).rejects.toBeInstanceOf(NotFoundError);
    await expect(getProjectView(OWNER_A, "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
  });
});
