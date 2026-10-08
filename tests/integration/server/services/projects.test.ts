import { describe, expect, it } from "vitest";
import { getDb } from "@/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/permissions";
import { milestoneInputSchema } from "@/lib/validation/milestone";
import { projectInputSchema, projectUpdateSchema, type ProjectUpdateInput } from "@/lib/validation/project";
import { cancelMilestone, createMilestone } from "@/server/services/payment-plan";
import { changeProjectStatus, createProject, deleteProject, updateProject } from "@/server/services/projects";
import { OWNER_A, OWNER_B } from "../../support/database";
import { activitiesOf, planOf, seedClient, seedProject } from "../../support/fixtures";

const details: ProjectUpdateInput = { name: "Acme website", currency: "NZD", total: "50,000.00" };
const update = (overrides: Partial<ProjectUpdateInput> = {}) => projectUpdateSchema.parse({ ...details, ...overrides });
const fixedMilestone = (amount: string) =>
  milestoneInputSchema.parse({ name: "Build", billingTrigger: "on_completion", pricingMode: "fixed", amount });

describe("createProject", () => {
  it("creates a draft with exactly one project_created activity", async () => {
    const { clientId, projectId } = await seedProject(OWNER_A, { startDate: "2026-03-01", expectedEndDate: "2026-06-30" });

    const project = await getDb().project.findUniqueOrThrow({ where: { id: projectId } });
    expect(project).toMatchObject({ ownerId: OWNER_A, clientId, status: "draft", currency: "NZD", activatedAt: null });
    expect(Number(project.totalAmountMinor)).toBe(5000000);
    expect(project.startDate?.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(await planOf(projectId)).toEqual([]);

    const activities = await activitiesOf(projectId);
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      ownerId: OWNER_A,
      clientId,
      projectId,
      type: "project_created",
      actor: "owner",
      summary: "Created project Acme website",
      data: {},
    });
  });

  it.each([
    ["deposit_30", 3, [1500000, 1166500, 1166500, 1167000]],
    ["deposit_50", 2, [2500000, 1250000, 1250000]],
    ["fixed", 4, [1250000, 1250000, 1250000, 1250000]],
  ] as const)("applies the %s preset with %i milestones, balanced", async (kind, count, amounts) => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind, count } });
    const plan = await planOf(projectId);
    expect(plan.map((row) => row.amountMinor)).toEqual(amounts);
    expect(plan.map((row) => row.position)).toEqual(amounts.map((_, i) => i));
    expect(plan[0].billingTrigger).toBe(kind === "fixed" ? "on_completion" : "upfront");
    expect(await activitiesOf(projectId)).toHaveLength(1);
  });

  it("refuses a preset that would leave a zero milestone, and rolls back", async () => {
    const clientId = await seedClient(OWNER_A);
    const values = projectInputSchema.parse({ ...details, clientId, total: "0.02", preset: { kind: "fixed", count: 3 } });
    await expect(createProject(OWNER_A, values)).rejects.toBeInstanceOf(ValidationError);
    expect(await getDb().project.count()).toBe(0);
  });

  it("refuses an archived client with Conflict and another owner's client with NotFound", async () => {
    const archived = await seedClient(OWNER_A, { archivedAt: new Date() });
    await expect(createProject(OWNER_A, projectInputSchema.parse({ ...details, clientId: archived }))).rejects.toBeInstanceOf(
      ConflictError,
    );
    const othersClient = await seedClient(OWNER_B);
    await expect(createProject(OWNER_A, projectInputSchema.parse({ ...details, clientId: othersClient }))).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(await getDb().project.count()).toBe(0);
  });
});

describe("updateProject", () => {
  it("saves changed fields and records them in form order", async () => {
    const { projectId } = await seedProject(OWNER_A);
    await updateProject(OWNER_A, projectId, update({ name: "Acme shop", expectedEndDate: "2026-12-01" }));

    const project = await getDb().project.findUniqueOrThrow({ where: { id: projectId } });
    expect(project.name).toBe("Acme shop");
    expect(project.expectedEndDate?.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    const activities = await activitiesOf(projectId);
    expect(activities.at(-1)).toMatchObject({
      type: "project_updated",
      data: { changedFields: ["name", "expectedEndDate"] },
      summary: "Updated project Acme shop",
    });
  });

  it("writes nothing for an unchanged save", async () => {
    const { projectId } = await seedProject(OWNER_A);
    await updateProject(OWNER_A, projectId, update());
    expect(await activitiesOf(projectId)).toHaveLength(1);
  });

  it("recomputes percentage milestones when the total changes", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "deposit_30", count: 2 } });
    await updateProject(OWNER_A, projectId, update({ total: "1,000.01" }));
    const amounts = (await planOf(projectId)).map((row) => row.amountMinor);
    expect(amounts).toEqual([30000, 35000, 35001]);
    expect(amounts.reduce((a, b) => a + b)).toBe(100001);
  });

  it("refuses a total below the fixed amounts, on the total field, and changes nothing", async () => {
    const { projectId } = await seedProject(OWNER_A);
    await createMilestone(OWNER_A, projectId, fixedMilestone("40,000"));
    const error = await updateProject(OWNER_A, projectId, update({ total: "39,999.99" })).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors).toEqual({ total: ["The payment plan already allocates more than this total."] });
    const project = await getDb().project.findUniqueOrThrow({ where: { id: projectId } });
    expect(Number(project.totalAmountMinor)).toBe(5000000);
  });

  it("refuses edits once a project is completed or cancelled", async () => {
    const { projectId } = await seedProject(OWNER_A);
    await changeProjectStatus(OWNER_A, projectId, "cancel");
    await expect(updateProject(OWNER_A, projectId, update({ name: "Later" }))).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("changeProjectStatus", () => {
  it("activates only a plan that allocates the total exactly", async () => {
    const { projectId } = await seedProject(OWNER_A);
    await expect(changeProjectStatus(OWNER_A, projectId, "activate")).rejects.toBeInstanceOf(ConflictError);

    await createMilestone(OWNER_A, projectId, fixedMilestone("30,000"));
    await expect(changeProjectStatus(OWNER_A, projectId, "activate")).rejects.toBeInstanceOf(ConflictError);

    await createMilestone(OWNER_A, projectId, fixedMilestone("20,000"));
    await changeProjectStatus(OWNER_A, projectId, "activate");
    const project = await getDb().project.findUniqueOrThrow({ where: { id: projectId } });
    expect(project.status).toBe("active");
    expect(project.activatedAt).toBeInstanceOf(Date);
    expect((await activitiesOf(projectId)).at(-1)).toMatchObject({
      type: "project_status_changed",
      data: { from: "draft", to: "active" },
      summary: "Activated project Acme website",
    });
  });

  it("does not count a cancelled milestone towards activation", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 2 } });
    const [first] = await planOf(projectId);
    await cancelMilestone(OWNER_A, first.id);
    await expect(changeProjectStatus(OWNER_A, projectId, "activate")).rejects.toBeInstanceOf(ConflictError);
  });

  it("pauses, resumes and cancels with the right timestamps, and refuses moves that do not exist", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 1 } });
    await expect(changeProjectStatus(OWNER_A, projectId, "pause")).rejects.toBeInstanceOf(ConflictError);
    await changeProjectStatus(OWNER_A, projectId, "activate");
    await changeProjectStatus(OWNER_A, projectId, "pause");
    expect((await getDb().project.findUniqueOrThrow({ where: { id: projectId } })).status).toBe("on_hold");
    await changeProjectStatus(OWNER_A, projectId, "resume");
    await changeProjectStatus(OWNER_A, projectId, "cancel");
    const project = await getDb().project.findUniqueOrThrow({ where: { id: projectId } });
    expect(project.status).toBe("cancelled");
    expect(project.cancelledAt).toBeInstanceOf(Date);
    await expect(changeProjectStatus(OWNER_A, projectId, "reopen")).rejects.toBeInstanceOf(ConflictError);
  });

  it("refuses to complete while a milestone is not completed", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 1 } });
    await changeProjectStatus(OWNER_A, projectId, "activate");
    await expect(changeProjectStatus(OWNER_A, projectId, "complete")).rejects.toBeInstanceOf(ConflictError);
  });

  it("completes and reopens, setting and clearing completedAt", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 1 } });
    await changeProjectStatus(OWNER_A, projectId, "activate");
    // Milestone completion is feature 19; stand in for it directly.
    await getDb().milestone.updateMany({ where: { projectId }, data: { status: "completed", completedAt: new Date() } });

    await changeProjectStatus(OWNER_A, projectId, "complete");
    let project = await getDb().project.findUniqueOrThrow({ where: { id: projectId } });
    expect(project.status).toBe("completed");
    expect(project.completedAt).toBeInstanceOf(Date);

    await changeProjectStatus(OWNER_A, projectId, "reopen");
    project = await getDb().project.findUniqueOrThrow({ where: { id: projectId } });
    expect(project.status).toBe("active");
    expect(project.completedAt).toBeNull();
  });
});

describe("deleteProject", () => {
  it("deletes a draft with its milestones and activities", async () => {
    const { clientId, projectId } = await seedProject(OWNER_A, { preset: { kind: "deposit_50", count: 2 } });
    await deleteProject(OWNER_A, projectId);
    expect(await getDb().project.count()).toBe(0);
    expect(await getDb().milestone.count()).toBe(0);
    expect(await getDb().activity.count({ where: { clientId } })).toBe(0);
  });

  it("refuses a project that is no longer a draft", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 1 } });
    await changeProjectStatus(OWNER_A, projectId, "activate");
    await expect(deleteProject(OWNER_A, projectId)).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("owner isolation", () => {
  it("gives owner B NotFound on every project service, changing nothing", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 1 } });
    await expect(updateProject(OWNER_B, projectId, update({ name: "Mine" }))).rejects.toBeInstanceOf(NotFoundError);
    await expect(changeProjectStatus(OWNER_B, projectId, "activate")).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteProject(OWNER_B, projectId)).rejects.toBeInstanceOf(NotFoundError);

    const project = await getDb().project.findUniqueOrThrow({ where: { id: projectId } });
    expect(project).toMatchObject({ name: "Acme website", status: "draft" });
    expect(await activitiesOf(projectId)).toHaveLength(1);
  });
});
