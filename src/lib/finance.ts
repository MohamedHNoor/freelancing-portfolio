/* Plan and progress figures, derived on the server from stored rows and never
   stored themselves. Pure functions: no I/O, no formatting. Money is integer
   minor units of one project's currency, so nothing here mixes currencies. */

import type { MilestoneBillingTrigger, MilestoneStatus } from "@/generated/prisma/enums";

type PlanMilestone = { status: MilestoneStatus; amountMinor: number };

export type PlanSummary = {
  /** The sum of non-cancelled milestone amounts. */
  allocated: number;
  /** The total minus `allocated`. Negative only if the plan invariant was broken. */
  unallocated: number;
  /** True when the plan allocates the total exactly, which activation requires. */
  balanced: boolean;
};

export function planSummary(totalMinor: number, milestones: readonly PlanMilestone[]): PlanSummary {
  const allocated = milestones
    .filter((milestone) => milestone.status !== "cancelled")
    .reduce((sum, milestone) => sum + milestone.amountMinor, 0);
  return { allocated, unallocated: totalMinor - allocated, balanced: allocated === totalMinor };
}

export type ProjectFigures = {
  paid: number;
  outstanding: number;
  requested: number;
  /** Whole percent, floored. */
  paymentProgress: number;
};

/** Paid and requested come from payments and open requests (features 20 and 21); until then both are 0. */
export function projectFigures({
  totalMinor,
  paidMinor,
  requestedMinor,
}: {
  totalMinor: number;
  paidMinor: number;
  requestedMinor: number;
}): ProjectFigures {
  return {
    paid: paidMinor,
    outstanding: totalMinor - paidMinor,
    requested: requestedMinor,
    paymentProgress: totalMinor > 0 ? Number((BigInt(paidMinor) * BigInt(100)) / BigInt(totalMinor)) : 0,
  };
}

/** A milestone's work progress in whole percent: 100 once completed, otherwise its share of done tasks. */
export function milestoneProgress({
  status,
  doneTasks,
  activeTasks,
}: {
  status: MilestoneStatus;
  doneTasks: number;
  /** Non-cancelled tasks. */
  activeTasks: number;
}): number {
  if (status === "completed") return 100;
  if (activeTasks <= 0) return 0;
  return Math.floor((doneTasks * 100) / activeTasks);
}

/**
 * Development progress in whole percent: the amount-weighted average of the
 * non-cancelled `on_completion` milestones' progress, floored. The deposit is
 * not work, so it is excluded. 0 when no milestone counts.
 */
export function developmentProgress(
  milestones: readonly {
    status: MilestoneStatus;
    billingTrigger: MilestoneBillingTrigger;
    amountMinor: number;
    progress: number;
  }[],
): number {
  const counted = milestones.filter((m) => m.status !== "cancelled" && m.billingTrigger === "on_completion");
  const weight = counted.reduce((sum, m) => sum + BigInt(m.amountMinor), BigInt(0));
  if (weight === BigInt(0)) return 0;
  const weighted = counted.reduce((sum, m) => sum + BigInt(m.amountMinor) * BigInt(m.progress), BigInt(0));
  return Number(weighted / weight);
}
