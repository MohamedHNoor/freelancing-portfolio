import { describe, expect, it } from "vitest";
import { CURRENCIES, formatMoney, minorFromDb, minorToDb, parseMoney } from "@/lib/money";

describe("parseMoney", () => {
  it.each([
    ["15,000.50", 1500050],
    ["15000.50", 1500050],
    ["1,234,567", 123456700],
    ["10", 1000],
    ["0.5", 50],
    ["0.05", 5],
    ["0", 0],
    ["  42.10  ", 4210],
  ])("parses %j to %d minor units", (input, expected) => {
    expect(parseMoney(input, "NZD")).toBe(expected);
  });

  it.each(["", " ", "1.234", "-5", "+5", "1e3", "abc", "12a", "1,23", "1,2345", ",100", "1.", ".5", "1.2.3", "1 000"])(
    "rejects %j",
    (input) => {
      expect(parseMoney(input, "ZAR")).toBeNull();
    },
  );

  it("accepts the largest safe amount and rejects anything above it", () => {
    expect(parseMoney("90071992547409.91", "USD")).toBe(Number.MAX_SAFE_INTEGER);
    expect(parseMoney("90071992547409.92", "USD")).toBeNull();
  });
});

describe("formatMoney", () => {
  it.each([
    ["ZAR", 1500050, /^R\s?15[\s, ]000[.,]50$/],
    ["NZD", 1500050, /^\$15,000\.50$/],
    ["AUD", 1500050, /^\$15,000\.50$/],
    ["USD", 1500050, /^\$15,000\.50$/],
    ["GBP", 1500050, /^£15,000\.50$/],
  ] as const)("formats %s with its own locale", (currency, minor, pattern) => {
    expect(formatMoney(minor, currency)).toMatch(pattern);
  });

  it("formats zero, single cents and the largest safe value exactly", () => {
    expect(formatMoney(0, "NZD")).toBe("$0.00");
    expect(formatMoney(5, "NZD")).toBe("$0.05");
    expect(formatMoney(Number.MAX_SAFE_INTEGER, "USD")).toBe("$90,071,992,547,409.91");
  });

  it("rejects amounts that are not safe integers", () => {
    expect(() => formatMoney(1.5, "NZD")).toThrow(RangeError);
    expect(() => formatMoney(Number.MAX_SAFE_INTEGER + 1, "NZD")).toThrow(RangeError);
  });

  it("covers every currency", () => {
    for (const currency of CURRENCIES) expect(formatMoney(100, currency)).toMatch(/1[.,]00/);
  });
});

describe("database conversion", () => {
  it("round-trips safe amounts", () => {
    expect(minorFromDb(BigInt(1500050))).toBe(1500050);
    expect(minorToDb(1500050)).toBe(BigInt(1500050));
  });

  it("rejects a value above Number.MAX_SAFE_INTEGER", () => {
    expect(() => minorFromDb(BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1))).toThrow(RangeError);
  });

  it("rejects fractions and unsafe numbers on the way in", () => {
    expect(() => minorToDb(10.5)).toThrow(RangeError);
    expect(() => minorToDb(Number.MAX_SAFE_INTEGER + 2)).toThrow(RangeError);
  });
});
