import { describe, expect, it } from "vitest";
import {
  PROJECT_FIELDS,
  planPresetSchema,
  projectInputSchema,
  projectStatusActionSchema,
  projectUpdateSchema,
} from "@/lib/validation/project";

const CLIENT_ID = "6f1c2a1e-0d7b-4c55-9a43-3f1a2b9c8d01";
const minimal = { clientId: CLIENT_ID, name: "Acme website", currency: "NZD", total: "15,000.50" };

function fieldErrors(schema: typeof projectInputSchema | typeof projectUpdateSchema, input: unknown) {
  const result = schema.safeParse(input);
  expect(result.success).toBe(false);
  return (result.error?.flatten().fieldErrors ?? {}) as Record<string, string[] | undefined>;
}

describe("projectInputSchema", () => {
  it("normalizes text, converts the total and empties optional fields", () => {
    expect(
      projectInputSchema.parse({
        ...minimal,
        name: "  Acme website ",
        description: "   ",
        startDate: "2026-03-01",
        expectedEndDate: "",
      }),
    ).toEqual({
      clientId: CLIENT_ID,
      name: "Acme website",
      description: null,
      currency: "NZD",
      totalAmountMinor: 1500050,
      startDate: "2026-03-01",
      expectedEndDate: null,
      preset: null,
    });
  });

  it("keeps a preset, coercing its count", () => {
    expect(projectInputSchema.parse({ ...minimal, preset: { kind: "deposit_30", count: "3" } }).preset).toEqual({
      kind: "deposit_30",
      count: 3,
    });
  });

  it("reports each invalid field on its own key", () => {
    const errors = fieldErrors(projectInputSchema, {
      clientId: "nope",
      name: " ",
      currency: "EUR",
      total: "1",
      description: "x".repeat(5001),
    });
    expect(errors.clientId).toEqual(["Choose a client."]);
    expect(errors.name).toEqual(["Enter the project name."]);
    expect(errors.currency).toEqual(["Choose a currency."]);
    expect(errors.description).toEqual(["Use at most 5,000 characters."]);
  });

  it.each([
    ["0", "Enter a total greater than zero."],
    ["0.00", "Enter a total greater than zero."],
    ["1.234", "Enter an amount such as 15,000.00."],
    ["-5", "Enter an amount such as 15,000.00."],
    ["", "Enter an amount such as 15,000.00."],
  ])("rejects a total of %j", (total, message) => {
    expect(fieldErrors(projectInputSchema, { ...minimal, total }).total).toEqual([message]);
  });

  it("refuses an end date before the start date, on the end date", () => {
    const errors = fieldErrors(projectInputSchema, { ...minimal, startDate: "2026-03-02", expectedEndDate: "2026-03-01" });
    expect(errors).toEqual({ expectedEndDate: ["Choose an end date on or after the start date."] });
    expect(projectInputSchema.safeParse({ ...minimal, startDate: "2026-03-01", expectedEndDate: "2026-03-01" }).success).toBe(true);
  });

  it("reports the date order and the total together", () => {
    const errors = fieldErrors(projectInputSchema, {
      ...minimal,
      total: "0",
      startDate: "2026-03-02",
      expectedEndDate: "2026-03-01",
    });
    expect(Object.keys(errors).sort()).toEqual(["expectedEndDate", "total"]);
  });

  it("rejects an invalid date and an invalid preset", () => {
    expect(fieldErrors(projectInputSchema, { ...minimal, startDate: "2026-02-30" }).startDate).toEqual([
      "Enter a date as YYYY-MM-DD.",
    ]);
    expect(fieldErrors(projectInputSchema, { ...minimal, preset: { kind: "thirds", count: 3 } }).preset).toBeDefined();
  });
});

describe("projectUpdateSchema", () => {
  it("has no client or preset", () => {
    const values = projectUpdateSchema.parse({ ...minimal, preset: { kind: "fixed", count: 2 } });
    expect(values).toEqual({
      name: "Acme website",
      description: null,
      currency: "NZD",
      totalAmountMinor: 1500050,
      startDate: null,
      expectedEndDate: null,
    });
    expect(Object.keys(values).sort()).toEqual([...PROJECT_FIELDS].sort());
  });
});

describe("planPresetSchema", () => {
  it.each([
    [{ kind: "deposit_30", count: 1 }, true],
    [{ kind: "deposit_50", count: 10 }, true],
    [{ kind: "fixed", count: "4" }, true],
    [{ kind: "fixed", count: 0 }, false],
    [{ kind: "fixed", count: 11 }, false],
    [{ kind: "fixed", count: 2.5 }, false],
    [{ kind: "fixed", count: "" }, false],
    [{ kind: "deposit_40", count: 2 }, false],
  ])("parses %j: %s", (input, ok) => {
    expect(planPresetSchema.safeParse(input).success).toBe(ok);
  });
});

describe("projectStatusActionSchema", () => {
  it("accepts the six actions only", () => {
    for (const action of ["activate", "pause", "resume", "complete", "reopen", "cancel"]) {
      expect(projectStatusActionSchema.safeParse({ action }).success).toBe(true);
    }
    expect(projectStatusActionSchema.safeParse({ action: "delete" }).success).toBe(false);
  });
});
