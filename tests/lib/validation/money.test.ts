import { describe, expect, it } from "vitest";
import { currencySchema, dateInputSchema, idSchema, moneyInputSchema, percentInputSchema } from "@/lib/validation/money";

describe("money schemas", () => {
  it("accepts the five currencies and rejects others", () => {
    expect(currencySchema.parse("NZD")).toBe("NZD");
    const result = currencySchema.safeParse("EUR");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Choose a currency.");
  });

  it("converts an entered amount to minor units", () => {
    expect(moneyInputSchema("ZAR").parse("15,000.50")).toBe(1500050);
  });

  it.each([
    ["0", "Enter an amount greater than zero."],
    ["0.00", "Enter an amount greater than zero."],
    ["1.234", "Enter an amount such as 1,500.00."],
    ["", "Enter an amount such as 1,500.00."],
  ])("rejects %j", (input, message) => {
    const result = moneyInputSchema("NZD").safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(message);
  });

  it("accepts uuids only", () => {
    expect(idSchema.safeParse("3f2c1b8e-9a4d-4c6e-8f1a-2b3c4d5e6f70").success).toBe(true);
    expect(idSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(idSchema.safeParse(42).success).toBe(false);
  });
});

describe("percentInputSchema", () => {
  it.each([
    ["30", 3000],
    ["12.5", 1250],
    [" 0.01 ", 1],
    ["100", 10000],
    ["100.00", 10000],
    ["33.33", 3333],
    ["007", 700],
  ])("parses %j to %d basis points", (input, bps) => {
    expect(percentInputSchema.parse(input)).toBe(bps);
  });

  it.each(["", "0", "0.00", "100.01", "101", "12.345", "-5", "1e2", "12,5", "abc", ".5", "1000"])("rejects %j", (input) => {
    expect(percentInputSchema.safeParse(input).success).toBe(false);
  });
});

describe("dateInputSchema", () => {
  it("keeps a real calendar date and empties to null", () => {
    expect(dateInputSchema.parse("2026-02-28")).toBe("2026-02-28");
    expect(dateInputSchema.parse("2028-02-29")).toBe("2028-02-29");
    expect(dateInputSchema.parse(" 2026-10-09 ")).toBe("2026-10-09");
    expect(dateInputSchema.parse("")).toBeNull();
    expect(dateInputSchema.parse(undefined)).toBeNull();
    expect(dateInputSchema.parse(null)).toBeNull();
  });

  it.each(["2026-02-29", "2026-13-01", "2026-00-10", "2026-04-31", "26-10-09", "2026/10/09", "9 Oct 2026"])(
    "rejects %j",
    (input) => {
      expect(dateInputSchema.safeParse(input).success).toBe(false);
    },
  );
});
