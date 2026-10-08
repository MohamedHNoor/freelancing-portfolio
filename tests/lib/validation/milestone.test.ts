import { describe, expect, it } from "vitest";
import { milestoneInputSchema, reorderMilestonesSchema } from "@/lib/validation/milestone";

const base = { name: " Backend ", billingTrigger: "on_completion" };

function fieldErrors(input: unknown) {
  const result = milestoneInputSchema.safeParse(input);
  expect(result.success).toBe(false);
  return result.error?.flatten().fieldErrors ?? {};
}

describe("milestoneInputSchema", () => {
  it("parses a percentage milestone to basis points", () => {
    expect(milestoneInputSchema.parse({ ...base, pricingMode: "percentage", percent: "20", dueDate: "2026-05-01" })).toEqual({
      name: "Backend",
      description: null,
      billingTrigger: "on_completion",
      dueDate: "2026-05-01",
      pricingMode: "percentage",
      percent: 2000,
    });
  });

  it("keeps a fixed amount as trimmed text for the server", () => {
    expect(milestoneInputSchema.parse({ ...base, billingTrigger: "upfront", pricingMode: "fixed", amount: " 1,500.00 " })).toEqual({
      name: "Backend",
      description: null,
      billingTrigger: "upfront",
      dueDate: null,
      pricingMode: "fixed",
      amount: "1,500.00",
    });
  });

  it("requires the field its pricing mode needs", () => {
    expect(fieldErrors({ ...base, pricingMode: "percentage" }).percent).toEqual(["Enter a percentage."]);
    expect(fieldErrors({ ...base, pricingMode: "fixed", amount: "  " }).amount).toEqual(["Enter an amount."]);
    expect(fieldErrors({ ...base, pricingMode: "percentage", percent: "120" }).percent).toEqual([
      "Enter a percentage above 0 and at most 100.",
    ]);
  });

  it("rejects an unknown pricing mode or billing trigger, an empty name and a long description", () => {
    expect(fieldErrors({ ...base, pricingMode: "hourly" }).pricingMode).toEqual(["Choose a percentage or a fixed amount."]);
    const errors = fieldErrors({
      name: "",
      billingTrigger: "monthly",
      pricingMode: "fixed",
      amount: "5",
      description: "x".repeat(2001),
      dueDate: "2026-02-30",
    });
    expect(errors.name).toEqual(["Enter the milestone name."]);
    expect(errors.billingTrigger).toEqual(["Choose when this milestone is billed."]);
    expect(errors.description).toEqual(["Use at most 2,000 characters."]);
    expect(errors.dueDate).toEqual(["Enter a date as YYYY-MM-DD."]);
    expect(fieldErrors({ ...base, name: "x".repeat(121), pricingMode: "fixed", amount: "5" }).name).toEqual([
      "Use at most 120 characters.",
    ]);
  });
});

describe("reorderMilestonesSchema", () => {
  const a = "6f1c2a1e-0d7b-4c55-9a43-3f1a2b9c8d01";
  const b = "6f1c2a1e-0d7b-4c55-9a43-3f1a2b9c8d02";

  it("accepts distinct ids", () => {
    expect(reorderMilestonesSchema.parse({ ids: [b, a] })).toEqual({ ids: [b, a] });
  });

  it.each([[[]], [[a, a]], [[a, "nope"]]])("rejects %j", (ids) => {
    expect(reorderMilestonesSchema.safeParse({ ids }).success).toBe(false);
  });
});
