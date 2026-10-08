import { describe, expect, it } from "vitest";
import { CURRENCIES, allocate, formatMoney, minorFromDb, minorToDb, parseMoney, splitEvenly } from "@/lib/money";

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

/** The exact share as a fraction of one minor unit, for the ±1 check. */
const exactShare = (total: number, bps: number) => (BigInt(total) * BigInt(bps) * BigInt(1000)) / BigInt(10000);

describe("allocate", () => {
  const totals = [1, 99, 100, 100001, 1500050, Number.MAX_SAFE_INTEGER];
  const plans: [string, number[]][] = [];
  for (const deposit of [3000, 5000]) {
    for (let count = 1; count <= 10; count += 1) {
      plans.push([`${deposit / 100}% deposit + ${count}`, [deposit, ...splitEvenly(10000 - deposit, count)]]);
    }
  }

  it.each(plans)("balances %s exactly on awkward totals", (_, bpsList) => {
    for (const total of totals) {
      const shares = allocate(total, bpsList);
      expect(shares).toHaveLength(bpsList.length);
      expect(shares.reduce((sum, share) => sum + BigInt(share), BigInt(0))).toBe(BigInt(total));
      shares.forEach((share, index) => {
        expect(Number.isSafeInteger(share)).toBe(true);
        const delta = BigInt(share) * BigInt(1000) - exactShare(total, bpsList[index]);
        expect(delta < BigInt(1000) && delta > BigInt(-1000)).toBe(true);
      });
    }
  });

  it("sums a partial plan to the total times Σbps, rounded half up", () => {
    expect(allocate(1, [5000])).toEqual([1]);
    expect(allocate(1, [4999])).toEqual([0]);
    expect(allocate(3, [5000])).toEqual([2]);
    expect(allocate(100000, [3000, 1500])).toEqual([30000, 15000]);
  });

  it("gives a tied remainder to the later share", () => {
    expect(allocate(100, [3333, 3333, 3334])).toEqual([33, 33, 34]);
    expect(allocate(1, [5000, 5000])).toEqual([0, 1]);
    expect(allocate(2, [3333, 3333, 3334])).toEqual([0, 1, 1]);
  });

  it("follows the largest remainder before position", () => {
    // Exact shares 0.3, 0.7: the larger remainder wins the single unit.
    expect(allocate(1, [3000, 7000])).toEqual([0, 1]);
    expect(allocate(1, [7000, 3000])).toEqual([1, 0]);
  });

  it.each([
    [0, [10000]],
    [-1, [10000]],
    [1.5, [10000]],
    [Number.MAX_SAFE_INTEGER + 1, [10000]],
    [100, []],
    [100, [0]],
    [100, [10001]],
    [100, [12.5]],
    [100, [6000, 5000]],
  ])("rejects a total of %d with %j", (total, bpsList) => {
    expect(() => allocate(total, bpsList)).toThrow(RangeError);
  });
});

describe("splitEvenly", () => {
  it.each([
    [7000, 3, [2333, 2333, 2334]],
    [5000, 4, [1250, 1250, 1250, 1250]],
    [10, 4, [2, 2, 3, 3]],
    [1, 3, [0, 0, 1]],
    [0, 2, [0, 0]],
  ])("splits %d into %d parts", (amount, parts, expected) => {
    expect(splitEvenly(amount, parts)).toEqual(expected);
  });

  it("keeps the exact sum at the largest safe amount", () => {
    const parts = splitEvenly(Number.MAX_SAFE_INTEGER, 7);
    expect(parts.reduce((sum, part) => sum + BigInt(part), BigInt(0))).toBe(BigInt(Number.MAX_SAFE_INTEGER));
  });

  it.each([
    [-1, 2],
    [1.5, 2],
    [10, 0],
    [10, 1.5],
  ])("rejects %d into %d parts", (amount, parts) => {
    expect(() => splitEvenly(amount, parts)).toThrow(RangeError);
  });
});
