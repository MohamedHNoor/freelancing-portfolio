import { describe, expect, it } from "vitest";
import { getDb } from "@/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/permissions";
import { milestoneInputSchema, type MilestoneInput } from "@/lib/validation/milestone";
import {
  applyPlanPreset,
  cancelMilestone,
  createMilestone,
  deleteMilestone,
  reorderMilestones,
  restoreMilestone,
  updateMilestone,
} from "@/server/services/payment-plan";
import { changeProjectStatus } from "@/server/services/projects";
import { OWNER_A, OWNER_B } from "../../support/database";
import { activitiesOf, planOf, seedProject } from "../../support/fixtures";

const percent = (name: string, value: string, extra: Partial<MilestoneInput> = {}) =>
  milestoneInputSchema.parse({ name, billingTrigger: "on_completion", pricingMode: "percentage", percent: value, ...extra });
const fixed = (name: string, amount: string, extra: Partial<MilestoneInput> = {}) =>
  milestoneInputSchema.parse({ name, billingTrigger: "on_completion", pricingMode: "fixed", amount, ...extra });
const deposit = (value: string) => percent("Deposit", value, { billingTrigger: "upfront" });

const amounts = async (projectId: string) => (await planOf(projectId)).map((row) => row.amountMinor);
const fieldErrorsOf = (promise: Promise<unknown>) =>
  promise.then(
    () => expect.fail("expected a ValidationError"),
    (error: unknown) => {
      expect(error).toBeInstanceOf(ValidationError);
      return (error as ValidationError).fieldErrors;
    },
  );

describe("balanced plans", () => {
  it.each(["30", "50"])("balances a %s%% deposit plus percentage milestones exactly", async (share) => {
    const { projectId } = await seedProject(OWNER_A, { total: "1,000.01" });
    const rest = (100 - Number(share)) / 2;
    await createMilestone(OWNER_A, projectId, percent("Design", String(rest)));
    await createMilestone(OWNER_A, projectId, percent("Build", String(rest)));
    await createMilestone(OWNER_A, projectId, deposit(share));

    const plan = await planOf(projectId);
    expect(plan.map((row) => [row.name, row.position, row.billingTrigger])).toEqual([
      ["Deposit", 0, "upfront"],
      ["Design", 1, "on_completion"],
      ["Build", 2, "on_completion"],
    ]);
    expect(plan.reduce((sum, row) => sum + row.amountMinor, 0)).toBe(100001);
    await changeProjectStatus(OWNER_A, projectId, "activate");
  });

  it("balances a fixed-only plan", async () => {
    const { projectId } = await seedProject(OWNER_A);
    await createMilestone(OWNER_A, projectId, fixed("Design", "15,000.50"));
    await createMilestone(OWNER_A, projectId, fixed("Build", "34,999.50"));
    expect(await amounts(projectId)).toEqual([1500050, 3499950]);
    await changeProjectStatus(OWNER_A, projectId, "activate");
  });

  it("balances a mixed plan: 30% deposit, fixed and percentage milestones", async () => {
    const { projectId } = await seedProject(OWNER_A);
    await createMilestone(OWNER_A, projectId, deposit("30"));
    await createMilestone(OWNER_A, projectId, fixed("Design", "7,500"));
    await createMilestone(OWNER_A, projectId, percent("Build", "55"));
    expect(await amounts(projectId)).toEqual([1500000, 750000, 2750000]);
    await changeProjectStatus(OWNER_A, projectId, "activate");
    expect((await activitiesOf(projectId)).map((a) => a.type)).toEqual([
      "project_created",
      "milestone_created",
      "milestone_created",
      "milestone_created",
      "project_status_changed",
    ]);
  });
});

describe("createMilestone", () => {
  it("records milestone_created linked to the project, client and milestone", async () => {
    const { clientId, projectId } = await seedProject(OWNER_A);
    const { milestoneId } = await createMilestone(OWNER_A, projectId, fixed("Design", "100", { dueDate: "2026-05-01" }));
    const [row] = await planOf(projectId);
    expect(row).toMatchObject({ id: milestoneId, status: "pending", pricingMode: "fixed", percentageBps: null, amountMinor: 10000 });
    expect(row.dueDate?.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect((await activitiesOf(projectId)).at(-1)).toMatchObject({
      type: "milestone_created",
      clientId,
      projectId,
      milestoneId,
      summary: "Added milestone Design",
    });
  });

  it("refuses over-allocation on the edited field and changes nothing", async () => {
    const { projectId } = await seedProject(OWNER_A);
    await createMilestone(OWNER_A, projectId, percent("Design", "60"));
    expect(await fieldErrorsOf(createMilestone(OWNER_A, projectId, percent("Build", "41")))).toEqual({
      percent: ["This would allocate more than the project total."],
    });
    expect(await fieldErrorsOf(createMilestone(OWNER_A, projectId, fixed("Build", "20,000.01")))).toEqual({
      amount: ["This would allocate more than the project total."],
    });
    expect(await amounts(projectId)).toEqual([3000000]);
  });

  it("refuses an amount the project currency cannot hold, and a share that rounds to zero", async () => {
    const { projectId } = await seedProject(OWNER_A, { total: "0.01" });
    expect(await fieldErrorsOf(createMilestone(OWNER_A, projectId, fixed("Build", "abc")))).toEqual({
      amount: ["Enter an amount such as 1,500.00."],
    });
    expect(await fieldErrorsOf(createMilestone(OWNER_A, projectId, fixed("Build", "0")))).toEqual({
      amount: ["Enter an amount greater than zero."],
    });
    expect(await fieldErrorsOf(createMilestone(OWNER_A, projectId, percent("Build", "10")))).toEqual({
      percent: ["This percentage is too small for the project total."],
    });
  });

  it("refuses a second deposit", async () => {
    const { projectId } = await seedProject(OWNER_A);
    await createMilestone(OWNER_A, projectId, deposit("30"));
    await expect(createMilestone(OWNER_A, projectId, deposit("20"))).rejects.toBeInstanceOf(ConflictError);
  });

  it("leaves exactly one milestone when two that each fit race for the same room", async () => {
    const { projectId } = await seedProject(OWNER_A);
    const results = await Promise.allSettled([
      createMilestone(OWNER_A, projectId, fixed("First", "30,000")),
      createMilestone(OWNER_A, projectId, fixed("Second", "30,000")),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual(["fulfilled", "rejected"]);
    const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(ValidationError);
    expect(await amounts(projectId)).toEqual([3000000]);
  });
});

describe("updateMilestone", () => {
  it("saves changed fields, recomputes the plan and records the change", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "deposit_30", count: 2 } });
    const [, first] = await planOf(projectId);
    await updateMilestone(OWNER_A, first.id, percent("Design", "20", { dueDate: "2026-06-01" }));

    expect(await amounts(projectId)).toEqual([1500000, 1000000, 1750000]);
    expect((await activitiesOf(projectId)).at(-1)).toMatchObject({
      type: "milestone_updated",
      milestoneId: first.id,
      data: { changedFields: ["name", "percentageBps", "amountMinor", "dueDate"] },
    });
  });

  it("switches pricing mode, and writes nothing for an unchanged save", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 2 } });
    const [first] = await planOf(projectId);
    await updateMilestone(OWNER_A, first.id, fixed("Milestone 1", "25,000"));
    expect(await activitiesOf(projectId)).toHaveLength(1);

    await updateMilestone(OWNER_A, first.id, percent("Milestone 1", "40"));
    const [updated] = await planOf(projectId);
    expect(updated).toMatchObject({ pricingMode: "percentage", percentageBps: 4000, amountMinor: 2000000 });
  });

  it("refuses over-allocation", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 2 } });
    const [first] = await planOf(projectId);
    expect(await fieldErrorsOf(updateMilestone(OWNER_A, first.id, fixed("Milestone 1", "25,000.01")))).toEqual({
      amount: ["This would allocate more than the project total."],
    });
  });

  it("keeps the deposit first: only the first milestone can become the deposit", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 2 } });
    const [first, second] = await planOf(projectId);
    await expect(updateMilestone(OWNER_A, second.id, fixed("Deposit", "25,000", { billingTrigger: "upfront" }))).rejects.toBeInstanceOf(
      ConflictError,
    );
    await updateMilestone(OWNER_A, first.id, fixed("Deposit", "25,000", { billingTrigger: "upfront" }));
    expect((await planOf(projectId))[0].billingTrigger).toBe("upfront");
  });

  it("refuses a cancelled milestone", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 2 } });
    const [first] = await planOf(projectId);
    await cancelMilestone(OWNER_A, first.id);
    await expect(updateMilestone(OWNER_A, first.id, fixed("Milestone 1", "1"))).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("reorderMilestones", () => {
  it("reorders, re-allocates and records the change", async () => {
    const { projectId } = await seedProject(OWNER_A, { total: "1.00" });
    await createMilestone(OWNER_A, projectId, percent("A", "33.33"));
    await createMilestone(OWNER_A, projectId, percent("B", "33.33"));
    await createMilestone(OWNER_A, projectId, percent("C", "33.34"));
    const [a, b, c] = await planOf(projectId);
    expect(await amounts(projectId)).toEqual([33, 33, 34]);

    await reorderMilestones(OWNER_A, projectId, [c.id, a.id, b.id]);
    const plan = await planOf(projectId);
    expect(plan.map((row) => [row.name, row.position, row.amountMinor])).toEqual([
      ["C", 0, 34],
      ["A", 1, 33],
      ["B", 2, 33],
    ]);
    expect((await activitiesOf(projectId)).at(-1)).toMatchObject({ type: "payment_plan_changed", data: { change: "reordered" } });
  });

  it("refuses a stale or incomplete list and a move of the deposit", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "deposit_30", count: 2 } });
    const [dep, one, two] = await planOf(projectId);
    await expect(reorderMilestones(OWNER_A, projectId, [dep.id, one.id])).rejects.toBeInstanceOf(ConflictError);
    await expect(reorderMilestones(OWNER_A, projectId, [dep.id, one.id, "6f1c2a1e-0d7b-4c55-9a43-3f1a2b9c8d01"])).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(reorderMilestones(OWNER_A, projectId, [one.id, dep.id, two.id])).rejects.toBeInstanceOf(ConflictError);
    await reorderMilestones(OWNER_A, projectId, [dep.id, two.id, one.id]);
    expect((await planOf(projectId)).map((row) => row.id)).toEqual([dep.id, two.id, one.id]);
  });
});

describe("deleteMilestone", () => {
  it("deletes from a draft, compacting positions", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 3 } });
    const [, middle] = await planOf(projectId);
    await deleteMilestone(OWNER_A, middle.id);
    const plan = await planOf(projectId);
    expect(plan.map((row) => [row.name, row.position])).toEqual([
      ["Milestone 1", 0],
      ["Milestone 3", 1],
    ]);
    expect((await activitiesOf(projectId)).at(-1)).toMatchObject({
      type: "payment_plan_changed",
      milestoneId: null,
      data: { change: "milestone_deleted" },
      summary: "Deleted milestone Milestone 2",
    });
  });

  it("refuses once the project is active", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 2 } });
    await changeProjectStatus(OWNER_A, projectId, "activate");
    const [first] = await planOf(projectId);
    await expect(deleteMilestone(OWNER_A, first.id)).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("cancelMilestone and restoreMilestone", () => {
  it("cancel frees the amount; restore brings it back when it fits", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 2 } });
    await changeProjectStatus(OWNER_A, projectId, "activate");
    const [first] = await planOf(projectId);

    await cancelMilestone(OWNER_A, first.id);
    let [row] = await planOf(projectId);
    expect(row).toMatchObject({ status: "cancelled", amountMinor: 2500000 });
    expect(row.cancelledAt).toBeInstanceOf(Date);
    await expect(cancelMilestone(OWNER_A, first.id)).rejects.toBeInstanceOf(ConflictError);

    await restoreMilestone(OWNER_A, first.id);
    [row] = await planOf(projectId);
    expect(row).toMatchObject({ status: "pending", cancelledAt: null });
    expect((await activitiesOf(projectId)).slice(-2).map((a) => [a.type, a.data])).toEqual([
      ["milestone_cancelled", {}],
      ["payment_plan_changed", { change: "milestone_restored" }],
    ]);
    await expect(restoreMilestone(OWNER_A, first.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it("refuses a restore that would over-allocate", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 2 } });
    const [first, second] = await planOf(projectId);
    await cancelMilestone(OWNER_A, first.id);
    await updateMilestone(OWNER_A, second.id, fixed("Milestone 2", "50,000"));
    await expect(restoreMilestone(OWNER_A, first.id)).rejects.toBeInstanceOf(ConflictError);
    expect((await planOf(projectId))[0].status).toBe("cancelled");
  });
});

describe("applyPlanPreset", () => {
  it("fills an empty draft plan with one activity", async () => {
    const { projectId } = await seedProject(OWNER_A);
    await applyPlanPreset(OWNER_A, projectId, { kind: "deposit_50", count: 2 });
    expect(await amounts(projectId)).toEqual([2500000, 1250000, 1250000]);
    expect((await activitiesOf(projectId)).at(-1)).toMatchObject({
      type: "payment_plan_changed",
      data: { change: "preset_applied" },
    });
  });

  it("never replaces milestones and never applies outside a draft", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 1 } });
    await expect(applyPlanPreset(OWNER_A, projectId, { kind: "fixed", count: 2 })).rejects.toBeInstanceOf(ConflictError);
    expect(await amounts(projectId)).toEqual([5000000]);

    const other = await seedProject(OWNER_A);
    await changeProjectStatus(OWNER_A, other.projectId, "cancel");
    await expect(applyPlanPreset(OWNER_A, other.projectId, { kind: "fixed", count: 2 })).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("closed projects", () => {
  it("refuse every plan change once cancelled", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 2 } });
    const [first, second] = await planOf(projectId);
    await changeProjectStatus(OWNER_A, projectId, "cancel");
    await expect(createMilestone(OWNER_A, projectId, fixed("New", "1"))).rejects.toBeInstanceOf(ConflictError);
    await expect(updateMilestone(OWNER_A, first.id, fixed("Milestone 1", "1"))).rejects.toBeInstanceOf(ConflictError);
    await expect(reorderMilestones(OWNER_A, projectId, [second.id, first.id])).rejects.toBeInstanceOf(ConflictError);
    await expect(cancelMilestone(OWNER_A, first.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it("refuse plan changes once completed", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 1 } });
    await changeProjectStatus(OWNER_A, projectId, "activate");
    await getDb().milestone.updateMany({ where: { projectId }, data: { status: "completed" } });
    await changeProjectStatus(OWNER_A, projectId, "complete");
    await expect(createMilestone(OWNER_A, projectId, fixed("Extra", "1"))).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("owner isolation", () => {
  it("gives owner B NotFound on every payment-plan service, changing nothing", async () => {
    const { projectId } = await seedProject(OWNER_A, { preset: { kind: "fixed", count: 2 } });
    const [first, second] = await planOf(projectId);
    const empty = await seedProject(OWNER_A);

    await expect(createMilestone(OWNER_B, projectId, fixed("Mine", "1"))).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateMilestone(OWNER_B, first.id, fixed("Mine", "1"))).rejects.toBeInstanceOf(NotFoundError);
    await expect(reorderMilestones(OWNER_B, projectId, [second.id, first.id])).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteMilestone(OWNER_B, first.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(cancelMilestone(OWNER_B, first.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(restoreMilestone(OWNER_B, first.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(applyPlanPreset(OWNER_B, empty.projectId, { kind: "fixed", count: 1 })).rejects.toBeInstanceOf(NotFoundError);

    expect((await planOf(projectId)).map((row) => [row.id, row.name, row.status])).toEqual([
      [first.id, "Milestone 1", "pending"],
      [second.id, "Milestone 2", "pending"],
    ]);
    expect(await planOf(empty.projectId)).toEqual([]);
    expect(await getDb().activity.count({ where: { ownerId: OWNER_B } })).toBe(0);
  });
});
