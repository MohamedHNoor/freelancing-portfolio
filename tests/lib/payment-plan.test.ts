import { describe, expect, it } from "vitest";
import { buildPreset, computePlan } from "@/lib/payment-plan";

const sum = (rows: { amountMinor: number }[]) => rows.reduce((total, row) => total + row.amountMinor, 0);

describe("buildPreset", () => {
  it("builds a 30% deposit and three milestones sharing 70%", () => {
    expect(buildPreset("deposit_30", 3, 5000000)).toEqual([
      { name: "Deposit", billingTrigger: "upfront", pricingMode: "percentage", percentageBps: 3000, amountMinor: 1500000 },
      { name: "Milestone 1", billingTrigger: "on_completion", pricingMode: "percentage", percentageBps: 2333, amountMinor: 1166500 },
      { name: "Milestone 2", billingTrigger: "on_completion", pricingMode: "percentage", percentageBps: 2333, amountMinor: 1166500 },
      { name: "Milestone 3", billingTrigger: "on_completion", pricingMode: "percentage", percentageBps: 2334, amountMinor: 1167000 },
    ]);
  });

  it("builds a 50% deposit and one milestone", () => {
    expect(buildPreset("deposit_50", 1, 100001)).toEqual([
      { name: "Deposit", billingTrigger: "upfront", pricingMode: "percentage", percentageBps: 5000, amountMinor: 50000 },
      { name: "Milestone 1", billingTrigger: "on_completion", pricingMode: "percentage", percentageBps: 5000, amountMinor: 50001 },
    ]);
  });

  it("builds equal fixed milestones with no deposit, leftover on the later rows", () => {
    expect(buildPreset("fixed", 3, 100)).toEqual([
      { name: "Milestone 1", billingTrigger: "on_completion", pricingMode: "fixed", percentageBps: null, amountMinor: 33 },
      { name: "Milestone 2", billingTrigger: "on_completion", pricingMode: "fixed", percentageBps: null, amountMinor: 33 },
      { name: "Milestone 3", billingTrigger: "on_completion", pricingMode: "fixed", percentageBps: null, amountMinor: 34 },
    ]);
  });

  it.each(["deposit_30", "deposit_50", "fixed"] as const)("%s balances exactly for every size", (kind) => {
    for (let count = 1; count <= 10; count += 1) {
      for (const total of [1000, 99999, 1500050, Number.MAX_SAFE_INTEGER]) {
        const rows = buildPreset(kind, count, total);
        expect(sum(rows)).toBe(total);
        if (kind !== "fixed") expect(rows.reduce((bps, row) => bps + (row.percentageBps ?? 0), 0)).toBe(10000);
      }
    }
  });

  it("can produce a zero row on a tiny total, for the caller to refuse", () => {
    expect(buildPreset("fixed", 3, 2).map((row) => row.amountMinor)).toEqual([0, 1, 1]);
  });
});

describe("computePlan", () => {
  const pct = (bps: number, status: "pending" | "cancelled" = "pending") =>
    ({ status, pricingMode: "percentage", percentageBps: bps, amountMinor: 1 }) as const;
  const fixed = (amountMinor: number, status: "pending" | "cancelled" = "pending") =>
    ({ status, pricingMode: "fixed", percentageBps: null, amountMinor }) as const;

  it("recomputes percentage amounts together and keeps fixed amounts", () => {
    expect(computePlan(100000, [pct(3000), fixed(20000), pct(5000)])).toEqual({ ok: true, amounts: [30000, 20000, 50000] });
  });

  it("allows an unbalanced plan under the total", () => {
    expect(computePlan(100000, [pct(3000)])).toEqual({ ok: true, amounts: [30000] });
    expect(computePlan(100000, [])).toEqual({ ok: true, amounts: [] });
  });

  it("ignores cancelled milestones, keeping their stored amount", () => {
    expect(computePlan(100000, [fixed(90000, "cancelled"), pct(10000), pct(5000, "cancelled")])).toEqual({
      ok: true,
      amounts: [90000, 100000, 1],
    });
  });

  it("refuses over-allocation by fixed amounts, by percentages, or both", () => {
    expect(computePlan(100000, [fixed(60000), fixed(40001)])).toEqual({ ok: false, reason: "over_allocated" });
    expect(computePlan(100000, [pct(6000), pct(5000)])).toEqual({ ok: false, reason: "over_allocated" });
    expect(computePlan(100000, [pct(7000), fixed(30001)])).toEqual({ ok: false, reason: "over_allocated" });
    expect(computePlan(100000, [pct(7000), fixed(30000)])).toEqual({ ok: true, amounts: [70000, 30000] });
  });

  it("refuses a percentage share that rounds to zero", () => {
    expect(computePlan(1, [pct(3000), pct(7000)])).toEqual({ ok: false, reason: "zero_share" });
  });
});
