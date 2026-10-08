/* Plan presets: shortcuts that produce editable draft milestones. They are not
   rules; once applied, every row can be edited like any other. */

import type { MilestoneBillingTrigger, MilestonePricingMode, MilestoneStatus } from "@/generated/prisma/enums";
import { allocate, splitEvenly } from "@/lib/money";
import type { PlanPresetKind } from "@/lib/validation/project";

export type PlanRow = {
  name: string;
  billingTrigger: MilestoneBillingTrigger;
  pricingMode: MilestonePricingMode;
  percentageBps: number | null;
  amountMinor: number;
};

const DEPOSIT_BPS: Record<Exclude<PlanPresetKind, "fixed">, number> = { deposit_30: 3000, deposit_50: 5000 };

const milestoneName = (index: number) => `Milestone ${index + 1}`;

/**
 * The rows a preset produces, in position order, balancing `totalMinor`
 * exactly. A deposit preset is a percentage deposit plus `count` percentage
 * milestones sharing the rest; `fixed` is `count` equal fixed milestones and no
 * deposit. Leftover basis points and minor units go to the later rows. A row can
 * be 0 when the total is tiny, so callers must check before storing.
 */
export function buildPreset(kind: PlanPresetKind, count: number, totalMinor: number): PlanRow[] {
  if (kind === "fixed") {
    return splitEvenly(totalMinor, count).map((amountMinor, index) => ({
      name: milestoneName(index),
      billingTrigger: "on_completion",
      pricingMode: "fixed",
      percentageBps: null,
      amountMinor,
    }));
  }

  const deposit = DEPOSIT_BPS[kind];
  const bpsList = [deposit, ...splitEvenly(10000 - deposit, count)];
  const amounts = allocate(totalMinor, bpsList);
  return bpsList.map((percentageBps, index) => ({
    name: index === 0 ? "Deposit" : milestoneName(index - 1),
    billingTrigger: index === 0 ? "upfront" : "on_completion",
    pricingMode: "percentage",
    percentageBps,
    amountMinor: amounts[index],
  }));
}

export type PlanEntry = {
  status: MilestoneStatus;
  pricingMode: MilestonePricingMode;
  percentageBps: number | null;
  /** The stored amount. Ignored and recomputed for non-cancelled percentage entries. */
  amountMinor: number;
};

export type PlanCheck =
  | { ok: true; amounts: number[] }
  | { ok: false; reason: "over_allocated" | "zero_share" };

/**
 * The plan a change would leave, with entries in position order. Non-cancelled
 * percentage milestones are re-allocated from the total together, so their
 * amounts always sum exactly; cancelled ones keep their stored amount and count
 * for nothing. The plan fails when it allocates more than the total, or when a
 * percentage share rounds to zero, which the database refuses.
 */
export function computePlan(totalMinor: number, entries: readonly PlanEntry[]): PlanCheck {
  const amounts = entries.map((entry) => entry.amountMinor);
  const percentage = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.status !== "cancelled" && entry.pricingMode === "percentage");

  if (percentage.length > 0) {
    const bpsList = percentage.map(({ entry }) => entry.percentageBps ?? 0);
    if (bpsList.reduce((sum, bps) => sum + bps, 0) > 10000) return { ok: false, reason: "over_allocated" };
    const shares = allocate(totalMinor, bpsList);
    if (shares.some((share) => share === 0)) return { ok: false, reason: "zero_share" };
    percentage.forEach(({ index }, i) => {
      amounts[index] = shares[i];
    });
  }

  const allocated = entries.reduce(
    (sum, entry, index) => (entry.status === "cancelled" ? sum : sum + BigInt(amounts[index])),
    BigInt(0),
  );
  return allocated > BigInt(totalMinor) ? { ok: false, reason: "over_allocated" } : { ok: true, amounts };
}
