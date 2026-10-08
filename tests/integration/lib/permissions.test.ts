import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/db";
import { NotFoundError, ownedMilestone, ownedProject } from "@/lib/permissions";
import { OWNER_A, OWNER_B } from "../support/database";

const MISSING = "6f1c2a1e-0d7b-4c55-9a43-3f1a2b9c8d01";

let projectA: string;
let projectB: string;
let milestoneA: string;
let milestoneB: string;

async function seed(ownerId: string) {
  const db = getDb();
  const client = await db.client.create({
    data: { ownerId, name: "Client", email: "client@example.com", defaultCurrency: "NZD" },
  });
  const project = await db.project.create({
    data: { ownerId, clientId: client.id, name: "Project", currency: "NZD", totalAmountMinor: BigInt(1000) },
  });
  const milestone = await db.milestone.create({
    data: { projectId: project.id, name: "M", position: 0, pricingMode: "fixed", amountMinor: BigInt(1000) },
  });
  return { project: project.id, milestone: milestone.id };
}

beforeEach(async () => {
  ({ project: projectA, milestone: milestoneA } = await seed(OWNER_A));
  ({ project: projectB, milestone: milestoneB } = await seed(OWNER_B));
});

describe.each([false, true])("owner-scoped loaders (forUpdate: %s)", (forUpdate) => {

  it("load the owner's own project and milestone", async () => {
    await getDb().$transaction(async (tx) => {
      expect((await ownedProject(tx, OWNER_A, projectA, { forUpdate })).id).toBe(projectA);
      const milestone = await ownedMilestone(tx, OWNER_A, milestoneA, { forUpdate });
      expect(milestone.id).toBe(milestoneA);
      expect(milestone.project.id).toBe(projectA);
    });
  });

  it.each([["malformed", "nope"], ["missing", MISSING]])("raise NotFound for a %s id", async (_, id) => {
    await getDb().$transaction(async (tx) => {
      await expect(ownedProject(tx, OWNER_A, id, { forUpdate })).rejects.toBeInstanceOf(NotFoundError);
      await expect(ownedMilestone(tx, OWNER_A, id, { forUpdate })).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  it("raise NotFound for another owner's records", async () => {
    await getDb().$transaction(async (tx) => {
      await expect(ownedProject(tx, OWNER_A, projectB, { forUpdate })).rejects.toBeInstanceOf(NotFoundError);
      await expect(ownedMilestone(tx, OWNER_A, milestoneB, { forUpdate })).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
