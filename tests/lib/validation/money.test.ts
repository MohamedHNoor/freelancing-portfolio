import { describe, expect, it } from "vitest";
import { currencySchema, idSchema, moneyInputSchema } from "@/lib/validation/money";

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
