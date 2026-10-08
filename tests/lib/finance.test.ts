import { describe, expect, it } from "vitest";
import { developmentProgress, milestoneProgress, planSummary, projectFigures } from "@/lib/finance";

describe("planSummary", () => {
  it("counts only non-cancelled milestones", () => {
    const summary = planSummary(100000, [
      { status: "pending", amountMinor: 30000 },
      { status: "cancelled", amountMinor: 20000 },
      { status: "in_progress", amountMinor: 50000 },
    ]);
    expect(summary).toEqual({ allocated: 80000, unallocated: 20000, balanced: false });
  });

  it("is balanced only when allocated equals the total", () => {
    expect(planSummary(100, [{ status: "pending", amountMinor: 100 }]).balanced).toBe(true);
    expect(planSummary(100, [{ status: "completed", amountMinor: 101 }])).toEqual({
      allocated: 101,
      unallocated: -1,
      balanced: false,
    });
  });

  it("reports an empty plan as wholly unallocated", () => {
    expect(planSummary(5000, [])).toEqual({ allocated: 0, unallocated: 5000, balanced: false });
  });
});

describe("projectFigures", () => {
  it("derives outstanding and floored payment progress", () => {
    expect(projectFigures({ totalMinor: 300, paidMinor: 200, requestedMinor: 50 })).toEqual({
      paid: 200,
      outstanding: 100,
      requested: 50,
      paymentProgress: 66,
    });
  });

  it("is zero before any payment", () => {
    expect(projectFigures({ totalMinor: 5000000, paidMinor: 0, requestedMinor: 0 })).toEqual({
      paid: 0,
      outstanding: 5000000,
      requested: 0,
      paymentProgress: 0,
    });
  });

  it("stays exact at the largest safe total", () => {
    const total = Number.MAX_SAFE_INTEGER;
    expect(projectFigures({ totalMinor: total, paidMinor: total, requestedMinor: 0 }).paymentProgress).toBe(100);
  });
});

describe("milestoneProgress", () => {
  it("is 100 once completed, whatever the tasks", () => {
    expect(milestoneProgress({ status: "completed", doneTasks: 0, activeTasks: 0 })).toBe(100);
  });

  it("floors the share of done tasks", () => {
    expect(milestoneProgress({ status: "in_progress", doneTasks: 4, activeTasks: 5 })).toBe(80);
    expect(milestoneProgress({ status: "in_progress", doneTasks: 2, activeTasks: 3 })).toBe(66);
  });

  it("is 0 with no active tasks", () => {
    expect(milestoneProgress({ status: "pending", doneTasks: 0, activeTasks: 0 })).toBe(0);
  });
});

describe("developmentProgress", () => {
  it("weights by amount, floors, and excludes the deposit and cancelled milestones", () => {
    expect(
      developmentProgress([
        { status: "completed", billingTrigger: "upfront", amountMinor: 1500000, progress: 100 },
        { status: "completed", billingTrigger: "on_completion", amountMinor: 750000, progress: 100 },
        { status: "in_progress", billingTrigger: "on_completion", amountMinor: 1000000, progress: 80 },
        { status: "pending", billingTrigger: "on_completion", amountMinor: 750000, progress: 0 },
        { status: "cancelled", billingTrigger: "on_completion", amountMinor: 999999, progress: 100 },
      ]),
    ).toBe(62); // (750000 × 100 + 1000000 × 80) / 2500000
  });

  it("is 0 when no milestone counts", () => {
    expect(developmentProgress([])).toBe(0);
    expect(
      developmentProgress([{ status: "pending", billingTrigger: "upfront", amountMinor: 100, progress: 0 }]),
    ).toBe(0);
  });

  it("does not overflow at large amounts", () => {
    const big = Number.MAX_SAFE_INTEGER;
    expect(
      developmentProgress([
        { status: "completed", billingTrigger: "on_completion", amountMinor: big, progress: 100 },
        { status: "pending", billingTrigger: "on_completion", amountMinor: big, progress: 0 },
      ]),
    ).toBe(50);
  });
});
