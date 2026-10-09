import { describe, expect, it } from "vitest";
import {
  bpsToPercentInput,
  formatCalendarDate,
  formatPercent,
  newProjectFormSchema,
  presetErrorField,
  toProjectInput,
  EMPTY_MILESTONE_FORM,
  milestoneFormFields,
  milestoneFormSchema,
  milestoneFormValues,
  toMilestoneInput,
  parseProjectStatusFilter,
  projectFormValues,
  projectStatusActions,
} from "@/lib/dashboard/projects";
import { parseMoney } from "@/lib/money";
import { milestoneInputSchema } from "@/lib/validation/milestone";
import { percentInputSchema } from "@/lib/validation/money";
import { projectUpdateSchema } from "@/lib/validation/project";

describe("parseProjectStatusFilter", () => {
  it.each(["draft", "active", "on_hold", "completed", "cancelled"])("keeps %s", (status) => {
    expect(parseProjectStatusFilter(status)).toBe(status);
  });

  it.each([undefined, "", "all", "Active", "on-hold", "bogus", ["active"], 3])("treats %j as all", (value) => {
    expect(parseProjectStatusFilter(value)).toBe("all");
  });
});

describe("bpsToPercentInput and formatPercent", () => {
  it.each([
    [10000, "100"],
    [3000, "30"],
    [1250, "12.5"],
    [1205, "12.05"],
    [1, "0.01"],
    [10, "0.1"],
  ])("writes %d as %s", (bps, text) => {
    expect(bpsToPercentInput(bps)).toBe(text);
    expect(formatPercent(bps)).toBe(`${text}%`);
  });

  it.each([1, 10, 99, 1250, 3333, 5000, 10000])("round-trips %d through the percentage field", (bps) => {
    expect(percentInputSchema.parse(bpsToPercentInput(bps))).toBe(bps);
  });
});

describe("formatCalendarDate", () => {
  it("shows the stored calendar day, not a shifted one", () => {
    expect(formatCalendarDate("2026-03-01")).toBe("1 Mar 2026");
    expect(formatCalendarDate("2026-12-31")).toBe("31 Dec 2026");
  });
});

describe("projectFormValues", () => {
  it("turns a stored project into form values that parse back to it", () => {
    const stored = {
      name: "Shop rebuild",
      description: null,
      currency: "NZD" as const,
      totalAmountMinor: 1500050,
      startDate: "2026-03-01",
      expectedEndDate: null,
    };
    const values = projectFormValues(stored);
    expect(values).toEqual({
      name: "Shop rebuild",
      description: "",
      currency: "NZD",
      total: "15000.50",
      startDate: "2026-03-01",
      expectedEndDate: "",
    });
    expect(projectUpdateSchema.parse(values)).toEqual(stored);
  });
});

describe("milestoneFormValues", () => {
  const base = { name: "Deposit", description: null, billingTrigger: "upfront" as const, dueDate: null };

  it("prefills a percentage milestone with its percent", () => {
    const values = milestoneFormValues({ ...base, pricingMode: "percentage", percentageBps: 3000, amountMinor: 450000 }, "ZAR");
    expect(values).toEqual({ ...base, description: "", dueDate: "", pricingMode: "percentage", percent: "30" });
    expect(milestoneInputSchema.parse(values)).toMatchObject({ pricingMode: "percentage", percent: 3000 });
  });

  it("prefills a fixed milestone with an amount that parses back exactly", () => {
    const values = milestoneFormValues(
      { ...base, billingTrigger: "on_completion", pricingMode: "fixed", percentageBps: null, amountMinor: 75005, dueDate: "2026-04-30" },
      "GBP",
    );
    expect(values).toMatchObject({ pricingMode: "fixed", amount: "750.05", dueDate: "2026-04-30" });
    expect(values.pricingMode === "fixed" && parseMoney(values.amount, "GBP")).toBe(75005);
  });
});

describe("projectStatusActions", () => {
  const open = { canActivate: true, canComplete: true };
  const actions = (status: Parameters<typeof projectStatusActions>[0], guards = open) =>
    projectStatusActions(status, guards).map(({ action }) => action);

  it.each([
    ["draft", ["activate", "cancel"]],
    ["active", ["pause", "complete", "cancel"]],
    ["on_hold", ["resume", "cancel"]],
    ["completed", ["reopen"]],
    ["cancelled", []],
  ] as const)("lists the moves from %s", (status, expected) => {
    expect(actions(status)).toEqual(expected);
  });

  it("enables every listed move when the guards pass", () => {
    expect(projectStatusActions("active", open).every(({ disabledReason }) => disabledReason === null)).toBe(true);
  });

  it("keeps activate listed with its reason when the plan is not balanced", () => {
    const [activate, cancel] = projectStatusActions("draft", { canActivate: false, canComplete: true });
    expect(activate).toEqual({ action: "activate", label: "Activate project", disabledReason: "Balance the payment plan first." });
    expect(cancel.disabledReason).toBeNull();
  });

  it("keeps complete listed with its reason while milestones are open", () => {
    const complete = projectStatusActions("active", { canActivate: true, canComplete: false }).find(
      ({ action }) => action === "complete",
    );
    expect(complete?.disabledReason).toBe("Complete every milestone first.");
  });
});

describe("newProjectFormSchema", () => {
  const form = {
    clientId: "8d1b4a52-0d3c-4b5e-9a3f-1c2d3e4f5a6b",
    name: "Shop",
    description: "",
    currency: "NZD" as const,
    total: "10,000.00",
    startDate: "",
    expectedEndDate: "",
    presetKind: "" as const,
    presetCount: "3",
  };

  it("sends no preset when None is chosen, whatever the count says", () => {
    expect(toProjectInput({ ...form, presetCount: "junk" }).preset).toBeNull();
    expect(newProjectFormSchema.parse({ ...form, presetCount: "junk" })).toMatchObject({ totalAmountMinor: 1000000, preset: null });
  });

  it("sends the chosen preset with its count", () => {
    expect(newProjectFormSchema.parse({ ...form, presetKind: "deposit_50" }).preset).toEqual({ kind: "deposit_50", count: 3 });
  });

  it("moves preset errors onto the flat count field", () => {
    const result = newProjectFormSchema.safeParse({ ...form, presetKind: "fixed", presetCount: "11" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map(({ path }) => path)).toEqual([["presetCount"]]);
  });

  it("keeps other field errors where they were", () => {
    expect(newProjectFormSchema.safeParse({ ...form, name: "" }).error?.issues.map(({ path }) => path)).toEqual([["name"]]);
    expect(newProjectFormSchema.safeParse({ ...form, total: "abc" }).error?.issues.map(({ path }) => path)).toEqual([["total"]]);
  });

  it.each([
    [["preset", "kind"], "presetKind"],
    [["preset", "count"], "presetCount"],
    [["preset"], "presetCount"],
  ] as const)("places a %j error on %s", (path, field) => {
    expect(presetErrorField(path)).toBe(field);
  });
});

describe("milestone form fields", () => {
  const form = { ...EMPTY_MILESTONE_FORM, name: "Design", percent: "25", amount: "999.00" };

  it("sends only the field the pricing mode uses", () => {
    expect(toMilestoneInput(form)).toEqual({
      name: "Design",
      description: "",
      billingTrigger: "on_completion",
      pricingMode: "percentage",
      percent: "25",
      dueDate: "",
    });
    expect(toMilestoneInput({ ...form, pricingMode: "fixed" })).toMatchObject({ pricingMode: "fixed", amount: "999.00" });
    expect(toMilestoneInput({ ...form, pricingMode: "fixed" })).not.toHaveProperty("percent");
  });

  it("validates the active pricing field only", () => {
    expect(milestoneFormSchema.parse({ ...form, amount: "junk" })).toMatchObject({ percent: 2500 });
    const result = milestoneFormSchema.safeParse({ ...form, pricingMode: "fixed", amount: "" });
    expect(result.error?.issues.map(({ path }) => path)).toEqual([["amount"]]);
  });

  it("fills a stored fixed milestone with its amount and an empty percentage", () => {
    const fields = milestoneFormFields(
      { name: "Build", description: "Pages", billingTrigger: "on_completion", pricingMode: "fixed", percentageBps: null, amountMinor: 120000, dueDate: null },
      "AUD",
    );
    expect(fields).toEqual({ ...EMPTY_MILESTONE_FORM, name: "Build", description: "Pages", pricingMode: "fixed", amount: "1200.00" });
  });
});
