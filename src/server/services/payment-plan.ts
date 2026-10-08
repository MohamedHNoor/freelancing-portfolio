import "server-only";
import { getDb } from "@/db";
import type { Milestone, Project } from "@/generated/prisma/client";
import { calendarDateFromDb, calendarDateToDb } from "@/lib/dates";
import { minorFromDb, minorToDb, parseMoney } from "@/lib/money";
import { buildPreset, computePlan, type PlanEntry } from "@/lib/payment-plan";
import {
  ConflictError,
  ValidationError,
  ownedMilestone,
  ownedProject,
  type Db,
} from "@/lib/permissions";
import { EDITABLE_PROJECT_STATUSES } from "@/lib/state/project";
import { MILESTONE_FIELDS, type MilestoneField, type MilestoneValues } from "@/lib/validation/milestone";
import type { PlanPreset } from "@/lib/validation/project";
import { recordActivity } from "@/server/services/activity";

/* Every change here locks the project row first (`forUpdate` on the project or
   milestone loader), so one lock serializes the whole plan: two concurrent
   edits can never both pass the invariant check. */

const OVER_ALLOCATED = "This would allocate more than the project total.";
const ZERO_SHARE = "This percentage is too small for the project total.";

type MilestoneResult = { projectId: string; clientId: string; milestoneId: string };
type PlanResult = { projectId: string; clientId: string };

/** A milestone as the plan check and the change detection compare it. */
type StoredMilestone = {
  name: string;
  description: string | null;
  billingTrigger: Milestone["billingTrigger"];
  pricingMode: Milestone["pricingMode"];
  percentageBps: number | null;
  amountMinor: number;
  dueDate: string | null;
};

export function assertPlanEditable(project: Project): void {
  if (!EDITABLE_PROJECT_STATUSES.includes(project.status)) throw new ConflictError();
}

export async function planRows(tx: Db, projectId: string): Promise<Milestone[]> {
  return tx.milestone.findMany({ where: { projectId }, orderBy: [{ position: "asc" }, { id: "asc" }] });
}

export function toEntry(milestone: Milestone): PlanEntry {
  return {
    status: milestone.status,
    pricingMode: milestone.pricingMode,
    percentageBps: milestone.percentageBps,
    amountMinor: minorFromDb(milestone.amountMinor),
  };
}

/** Writes recomputed amounts for the rows whose amount changed. */
export async function writeAmounts(tx: Db, rows: readonly Milestone[], amounts: readonly number[]): Promise<void> {
  for (const [index, row] of rows.entries()) {
    if (minorFromDb(row.amountMinor) !== amounts[index]) {
      await tx.milestone.update({ where: { id: row.id }, data: { amountMinor: minorToDb(amounts[index]) } });
    }
  }
}

/** Re-allocates the plan after a change that cannot over-allocate, such as a reorder, delete or cancel. */
async function rebalance(tx: Db, project: Project): Promise<void> {
  const rows = await planRows(tx, project.id);
  const plan = computePlan(minorFromDb(project.totalAmountMinor), rows.map(toEntry));
  if (!plan.ok) throw new ConflictError();
  await writeAmounts(tx, rows, plan.amounts);
}

/** Converts validated input into stored values. A fixed amount is read in the project's currency. */
function toStored(values: MilestoneValues, project: Project): StoredMilestone {
  const shared = {
    name: values.name,
    description: values.description,
    billingTrigger: values.billingTrigger,
    dueDate: values.dueDate,
  };
  if (values.pricingMode === "percentage") {
    // The amount is a placeholder until computePlan allocates it.
    return { ...shared, pricingMode: "percentage", percentageBps: values.percent, amountMinor: 0 };
  }

  const amountMinor = parseMoney(values.amount, project.currency);
  if (amountMinor === null) throw new ValidationError({ amount: ["Enter an amount such as 1,500.00."] });
  if (amountMinor <= 0) throw new ValidationError({ amount: ["Enter an amount greater than zero."] });
  return { ...shared, pricingMode: "fixed", percentageBps: null, amountMinor };
}

function planFailure(reason: "over_allocated" | "zero_share", pricingMode: StoredMilestone["pricingMode"]): never {
  const field = pricingMode === "fixed" ? "amount" : "percent";
  throw new ValidationError({ [field]: [reason === "over_allocated" ? OVER_ALLOCATED : ZERO_SHARE] });
}

function storedData(stored: StoredMilestone) {
  return { ...stored, amountMinor: minorToDb(stored.amountMinor), dueDate: calendarDateToDb(stored.dueDate) };
}

/** Inserts preset rows into an empty draft plan, refusing a preset that leaves a zero-amount row. */
export async function insertPreset(tx: Db, project: Project, preset: PlanPreset): Promise<void> {
  const rows = buildPreset(preset.kind, preset.count, minorFromDb(project.totalAmountMinor));
  if (rows.some((row) => row.amountMinor <= 0)) {
    throw new ValidationError({ preset: ["The total is too small for this many milestones."] });
  }
  await tx.milestone.createMany({
    data: rows.map((row, position) => ({
      ...row,
      projectId: project.id,
      position,
      amountMinor: minorToDb(row.amountMinor),
    })),
  });
}

/** Adds a milestone. A deposit (upfront) goes first, and a project has at most one. */
export async function createMilestone(ownerId: string, projectId: string, values: MilestoneValues): Promise<MilestoneResult> {
  return getDb().$transaction(async (tx) => {
    const project = await ownedProject(tx, ownerId, projectId, { forUpdate: true });
    assertPlanEditable(project);
    const stored = toStored(values, project);
    const rows = await planRows(tx, project.id);

    const isDeposit = stored.billingTrigger === "upfront";
    if (isDeposit && rows.some((row) => row.billingTrigger === "upfront")) throw new ConflictError();

    const newEntry: PlanEntry = { status: "pending", ...stored };
    const entries = isDeposit ? [newEntry, ...rows.map(toEntry)] : [...rows.map(toEntry), newEntry];
    const plan = computePlan(minorFromDb(project.totalAmountMinor), entries);
    if (!plan.ok) planFailure(plan.reason, stored.pricingMode);

    const newIndex = isDeposit ? 0 : rows.length;
    if (isDeposit) await tx.milestone.updateMany({ where: { projectId: project.id }, data: { position: { increment: 1 } } });
    const { id } = await tx.milestone.create({
      data: { ...storedData({ ...stored, amountMinor: plan.amounts[newIndex] }), projectId: project.id, position: newIndex },
      select: { id: true },
    });
    await writeAmounts(tx, rows, isDeposit ? plan.amounts.slice(1) : plan.amounts.slice(0, -1));

    await recordActivity(tx, {
      ownerId,
      clientId: project.clientId,
      projectId: project.id,
      milestoneId: id,
      actor: "owner",
      type: "milestone_created",
      data: {},
      summary: `Added milestone ${stored.name}`,
    });
    return { projectId: project.id, clientId: project.clientId, milestoneId: id };
  });
}

/** Saves changed fields only. The deposit must stay first, and a cancelled milestone cannot change. */
export async function updateMilestone(ownerId: string, milestoneId: string, values: MilestoneValues): Promise<MilestoneResult> {
  return getDb().$transaction(async (tx) => {
    const current = await ownedMilestone(tx, ownerId, milestoneId, { forUpdate: true });
    const { project } = current;
    assertPlanEditable(project);
    if (current.status === "cancelled") throw new ConflictError();

    const stored = toStored(values, project);
    const rows = await planRows(tx, project.id);
    const index = rows.findIndex((row) => row.id === current.id);

    if (stored.billingTrigger === "upfront" && current.billingTrigger !== "upfront") {
      // Becoming the deposit is allowed only in first place, and only when there is no other.
      if (index !== 0 || rows.some((row) => row.billingTrigger === "upfront")) throw new ConflictError();
    }

    const entries = rows.map(toEntry);
    entries[index] = { status: current.status, ...stored };
    const plan = computePlan(minorFromDb(project.totalAmountMinor), entries);
    if (!plan.ok) planFailure(plan.reason, stored.pricingMode);

    const next: StoredMilestone = { ...stored, amountMinor: plan.amounts[index] };
    const before: StoredMilestone = {
      name: current.name,
      description: current.description,
      billingTrigger: current.billingTrigger,
      pricingMode: current.pricingMode,
      percentageBps: current.percentageBps,
      amountMinor: minorFromDb(current.amountMinor),
      dueDate: calendarDateFromDb(current.dueDate),
    };
    const changedFields = MILESTONE_FIELDS.filter((field: MilestoneField) => before[field] !== next[field]);
    const [first, ...rest] = changedFields;
    if (first === undefined) return { projectId: project.id, clientId: project.clientId, milestoneId: current.id };

    await tx.milestone.update({ where: { id: current.id }, data: storedData(next) });
    await writeAmounts(
      tx,
      rows.filter((row) => row.id !== current.id),
      plan.amounts.filter((_, i) => i !== index),
    );
    await recordActivity(tx, {
      ownerId,
      clientId: project.clientId,
      projectId: project.id,
      milestoneId: current.id,
      actor: "owner",
      type: "milestone_updated",
      data: { changedFields: [first, ...rest] },
      summary: `Updated milestone ${next.name}`,
    });
    return { projectId: project.id, clientId: project.clientId, milestoneId: current.id };
  });
}

/**
 * Puts the plan in the given order. `ids` must be exactly the project's
 * milestones, so a stale list fails, and the deposit must stay first.
 * Re-allocates, because rounding ties go to the later milestone.
 */
export async function reorderMilestones(ownerId: string, projectId: string, ids: readonly string[]): Promise<PlanResult> {
  return getDb().$transaction(async (tx) => {
    const project = await ownedProject(tx, ownerId, projectId, { forUpdate: true });
    assertPlanEditable(project);
    const rows = await planRows(tx, project.id);

    const known = new Set(rows.map((row) => row.id));
    if (ids.length !== rows.length || ids.some((id) => !known.has(id))) throw new ConflictError();
    const deposit = rows.find((row) => row.billingTrigger === "upfront");
    if (deposit !== undefined && ids[0] !== deposit.id) throw new ConflictError();
    if (ids.every((id, position) => rows[position].id === id)) return { projectId: project.id, clientId: project.clientId };

    for (const [position, id] of ids.entries()) {
      await tx.milestone.update({ where: { id }, data: { position } });
    }
    await rebalance(tx, project);
    await recordActivity(tx, {
      ownerId,
      clientId: project.clientId,
      projectId: project.id,
      actor: "owner",
      type: "payment_plan_changed",
      data: { change: "reordered" },
      summary: `Reordered the payment plan of ${project.name}`,
    });
    return { projectId: project.id, clientId: project.clientId };
  });
}

/** Removes a milestone from a draft plan. Once a project is active, cancel instead. */
export async function deleteMilestone(ownerId: string, milestoneId: string): Promise<MilestoneResult> {
  return getDb().$transaction(async (tx) => {
    const current = await ownedMilestone(tx, ownerId, milestoneId, { forUpdate: true });
    const { project } = current;
    if (project.status !== "draft") throw new ConflictError();

    await tx.milestone.delete({ where: { id: current.id } });
    await tx.milestone.updateMany({
      where: { projectId: project.id, position: { gt: current.position } },
      data: { position: { decrement: 1 } },
    });
    await rebalance(tx, project);
    await recordActivity(tx, {
      ownerId,
      clientId: project.clientId,
      projectId: project.id,
      // The milestone row is gone, so the record cannot link to it.
      actor: "owner",
      type: "payment_plan_changed",
      data: { change: "milestone_deleted" },
      summary: `Deleted milestone ${current.name}`,
    });
    return { projectId: project.id, clientId: project.clientId, milestoneId: current.id };
  });
}

/** Cancels a milestone that has not been completed. Its amount becomes unallocated. */
export async function cancelMilestone(ownerId: string, milestoneId: string): Promise<MilestoneResult> {
  return getDb().$transaction(async (tx) => {
    const current = await ownedMilestone(tx, ownerId, milestoneId, { forUpdate: true });
    const { project } = current;
    assertPlanEditable(project);

    // Feature 20: also refuse while the milestone has payments or an open request.
    const { count } = await tx.milestone.updateMany({
      where: { id: current.id, status: { in: ["pending", "in_progress"] } },
      data: { status: "cancelled", cancelledAt: new Date() },
    });
    if (count !== 1) throw new ConflictError();

    await rebalance(tx, project);
    await recordActivity(tx, {
      ownerId,
      clientId: project.clientId,
      projectId: project.id,
      milestoneId: current.id,
      actor: "owner",
      type: "milestone_cancelled",
      data: {},
      summary: `Cancelled milestone ${current.name}`,
    });
    return { projectId: project.id, clientId: project.clientId, milestoneId: current.id };
  });
}

/** Returns a cancelled milestone to the plan as pending, if the plan still has room for it. */
export async function restoreMilestone(ownerId: string, milestoneId: string): Promise<MilestoneResult> {
  return getDb().$transaction(async (tx) => {
    const current = await ownedMilestone(tx, ownerId, milestoneId, { forUpdate: true });
    const { project } = current;
    assertPlanEditable(project);
    if (current.status !== "cancelled") throw new ConflictError();

    const rows = await planRows(tx, project.id);
    const entries = rows.map((row) => (row.id === current.id ? { ...toEntry(row), status: "pending" as const } : toEntry(row)));
    const plan = computePlan(minorFromDb(project.totalAmountMinor), entries);
    if (!plan.ok) throw new ConflictError();

    const { count } = await tx.milestone.updateMany({
      where: { id: current.id, status: "cancelled" },
      data: { status: "pending", cancelledAt: null },
    });
    if (count !== 1) throw new ConflictError();
    await writeAmounts(tx, rows, plan.amounts);

    await recordActivity(tx, {
      ownerId,
      clientId: project.clientId,
      projectId: project.id,
      milestoneId: current.id,
      actor: "owner",
      type: "payment_plan_changed",
      data: { change: "milestone_restored" },
      summary: `Restored milestone ${current.name}`,
    });
    return { projectId: project.id, clientId: project.clientId, milestoneId: current.id };
  });
}

/** Fills an empty draft plan from a preset. It never replaces existing milestones. */
export async function applyPlanPreset(ownerId: string, projectId: string, preset: PlanPreset): Promise<PlanResult> {
  return getDb().$transaction(async (tx) => {
    const project = await ownedProject(tx, ownerId, projectId, { forUpdate: true });
    if (project.status !== "draft") throw new ConflictError();
    if ((await tx.milestone.count({ where: { projectId: project.id } })) > 0) throw new ConflictError();

    await insertPreset(tx, project, preset);
    await recordActivity(tx, {
      ownerId,
      clientId: project.clientId,
      projectId: project.id,
      actor: "owner",
      type: "payment_plan_changed",
      data: { change: "preset_applied" },
      summary: `Applied a payment plan preset to ${project.name}`,
    });
    return { projectId: project.id, clientId: project.clientId };
  });
}
