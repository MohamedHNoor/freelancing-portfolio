import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/db";
import { OWNER_A } from "../support/database";

/* The hand-written checks in the projects_and_milestones migration. Raw inserts
   bypass every service rule, so only the database stands in the way. */

let clientId: string;
let projectId: string;

beforeEach(async () => {
  const db = getDb();
  ({ id: clientId } = await db.client.create({
    data: { ownerId: OWNER_A, name: "Aroha", email: "aroha@example.com", defaultCurrency: "NZD" },
  }));
  ({ id: projectId } = await db.project.create({
    data: { ownerId: OWNER_A, clientId, name: "Website", currency: "NZD", totalAmountMinor: BigInt(100000) },
  }));
});

const insertProject = (total: bigint, start: string | null, end: string | null) => getDb().$executeRaw`
  INSERT INTO projects (owner_id, client_id, name, currency, total_amount_minor, start_date, expected_end_date)
  VALUES (${OWNER_A}::uuid, ${clientId}::uuid, 'P', 'NZD', ${total}, ${start}::date, ${end}::date)`;

const insertMilestone = (position: number, mode: string, bps: number | null, amount: bigint) => getDb().$executeRaw`
  INSERT INTO milestones (project_id, name, position, pricing_mode, percentage_bps, amount_minor)
  VALUES (${projectId}::uuid, 'M', ${position}, ${mode}::milestone_pricing_mode, ${bps}, ${amount})`;

describe("projects checks", () => {
  it("accept a valid project, with or without dates", async () => {
    await expect(insertProject(BigInt(1), "2026-03-01", "2026-03-01")).resolves.toBe(1);
    await expect(insertProject(BigInt(1), null, null)).resolves.toBe(1);
  });

  it("reject a total of zero", async () => {
    await expect(insertProject(BigInt(0), null, null)).rejects.toThrow(/projects_total_amount_minor_check/);
  });

  it("reject an end date before the start date", async () => {
    await expect(insertProject(BigInt(1), "2026-03-02", "2026-03-01")).rejects.toThrow(/projects_dates_check/);
  });
});

describe("milestones checks", () => {
  it("accept valid percentage and fixed milestones", async () => {
    await expect(insertMilestone(0, "percentage", 10000, BigInt(1))).resolves.toBe(1);
    await expect(insertMilestone(1, "percentage", 1, BigInt(1))).resolves.toBe(1);
    await expect(insertMilestone(2, "fixed", null, BigInt(1))).resolves.toBe(1);
  });

  it.each([0, 10001])("reject %i basis points", async (bps) => {
    await expect(insertMilestone(0, "percentage", bps, BigInt(1))).rejects.toThrow(/milestones_percentage_bps_check/);
  });

  it("reject percentage mode without basis points", async () => {
    await expect(insertMilestone(0, "percentage", null, BigInt(1))).rejects.toThrow(/milestones_pricing_mode_check/);
  });

  it("reject fixed mode with basis points", async () => {
    await expect(insertMilestone(0, "fixed", 3000, BigInt(1))).rejects.toThrow(/milestones_pricing_mode_check/);
  });

  it("reject a negative position", async () => {
    await expect(insertMilestone(-1, "fixed", null, BigInt(1))).rejects.toThrow(/milestones_position_check/);
  });

  it("reject an amount of zero", async () => {
    await expect(insertMilestone(0, "fixed", null, BigInt(0))).rejects.toThrow(/milestones_amount_minor_check/);
  });
});
