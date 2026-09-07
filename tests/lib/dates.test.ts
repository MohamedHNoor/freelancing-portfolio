import { describe, expect, it } from "vitest";

import { PRESENT, formatRoleEnd, formatYearMonth } from "@/lib/dates";

/* Every expectation is a literal string. An expectation derived from `Intl` or
   `Date` would agree with whatever locale and timezone the runner happens to
   have, which is exactly the failure this module exists to avoid. */

describe("formatYearMonth", () => {
  it("maps all twelve months to their three-letter English names", () => {
    expect(formatYearMonth("2024-01")).toBe("Jan 2024");
    expect(formatYearMonth("2024-02")).toBe("Feb 2024");
    expect(formatYearMonth("2024-03")).toBe("Mar 2024");
    expect(formatYearMonth("2024-04")).toBe("Apr 2024");
    expect(formatYearMonth("2024-05")).toBe("May 2024");
    expect(formatYearMonth("2024-06")).toBe("Jun 2024");
    expect(formatYearMonth("2024-07")).toBe("Jul 2024");
    expect(formatYearMonth("2024-08")).toBe("Aug 2024");
    expect(formatYearMonth("2024-09")).toBe("Sep 2024");
    expect(formatYearMonth("2024-10")).toBe("Oct 2024");
    expect(formatYearMonth("2024-11")).toBe("Nov 2024");
    expect(formatYearMonth("2024-12")).toBe("Dec 2024");
  });

  it("keeps the year verbatim rather than reinterpreting it", () => {
    expect(formatYearMonth("1999-12")).toBe("Dec 1999");
    expect(formatYearMonth("2021-03")).toBe("Mar 2021");
  });

  it("formats the first day boundary without shifting the month", () => {
    // A Date-based implementation parsing "2024-01" as UTC midnight and
    // formatting in a negative offset renders December of the previous year.
    expect(formatYearMonth("2024-01")).toBe("Jan 2024");
  });

  it("rejects the present sentinel, which is not a year-month", () => {
    expect(() => formatYearMonth(PRESENT)).toThrow(RangeError);
  });

  it("rejects a month outside 01 to 12", () => {
    expect(() => formatYearMonth("2024-13")).toThrow(RangeError);
    expect(() => formatYearMonth("2024-00")).toThrow(RangeError);
  });

  it("rejects an unpadded month", () => {
    expect(() => formatYearMonth("2024-1")).toThrow(RangeError);
  });

  it("rejects a two-digit year", () => {
    expect(() => formatYearMonth("24-06")).toThrow(RangeError);
  });

  it("rejects an empty string", () => {
    expect(() => formatYearMonth("")).toThrow(RangeError);
  });

  it("rejects a full date and surrounding whitespace", () => {
    expect(() => formatYearMonth("2024-06-01")).toThrow(RangeError);
    expect(() => formatYearMonth(" 2024-06")).toThrow(RangeError);
    expect(() => formatYearMonth("2024-06 ")).toThrow(RangeError);
  });

  it("names the offending value in the error", () => {
    expect(() => formatYearMonth("nope")).toThrow(/"nope"/);
  });
});

describe("formatRoleEnd", () => {
  it("renders the present sentinel as a capitalised word", () => {
    expect(formatRoleEnd(PRESENT)).toBe("Present");
  });

  it("formats a dated end like any other year-month", () => {
    expect(formatRoleEnd("2024-05")).toBe("May 2024");
    expect(formatRoleEnd("2022-08")).toBe("Aug 2022");
  });

  it("matches the sentinel exactly, not case-insensitively", () => {
    expect(() => formatRoleEnd("Present")).toThrow(RangeError);
    expect(() => formatRoleEnd("PRESENT")).toThrow(RangeError);
  });

  it("rejects a malformed end date", () => {
    expect(() => formatRoleEnd("ongoing")).toThrow(RangeError);
  });
});

describe("PRESENT", () => {
  it("is the exact sentinel the content layer stores", () => {
    expect(PRESENT).toBe("present");
  });
});
