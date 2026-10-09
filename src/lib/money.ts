/* Money is an integer number of minor units beside an explicit currency. Every
   conversion here works on strings or BigInt, never on a decimal float. */

export const CURRENCIES = ["ZAR", "NZD", "AUD", "USD", "GBP"] as const;

export type Currency = (typeof CURRENCIES)[number];

/** Display names for currency pickers. */
export const CURRENCY_NAMES: Record<Currency, string> = {
  ZAR: "South African rand",
  NZD: "New Zealand dollar",
  AUD: "Australian dollar",
  USD: "US dollar",
  GBP: "British pound",
};

/** Minor units per major unit, as a power of ten. All five currencies use cents. */
export const CURRENCY_EXPONENT: Record<Currency, number> = {
  ZAR: 2,
  NZD: 2,
  AUD: 2,
  USD: 2,
  GBP: 2,
};

/** An explicit locale per currency, so output never depends on the machine. */
export const CURRENCY_LOCALE: Record<Currency, string> = {
  ZAR: "en-ZA",
  NZD: "en-NZ",
  AUD: "en-AU",
  USD: "en-US",
  GBP: "en-GB",
};

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

/** Plain digits, or comma-grouped thousands, with an optional fraction. */
const MONEY_PATTERN = /^(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d+))?$/;

/**
 * Parses an entered amount into minor units: `parseMoney("15,000.50", "NZD")`
 * is 1500050. Returns null for empty or malformed input, more decimals than the
 * currency allows, or a result that is not a safe integer.
 */
export function parseMoney(input: string, currency: Currency): number | null {
  const match = MONEY_PATTERN.exec(input.trim());
  if (match === null) return null;

  const exponent = CURRENCY_EXPONENT[currency];
  const whole = match[1].replace(/,/g, "");
  const fraction = match[2] ?? "";
  if (fraction.length > exponent) return null;

  const minor = BigInt(whole + fraction.padEnd(exponent, "0"));
  return minor > MAX_SAFE ? null : Number(minor);
}

function assertSafeMinor(minor: number): void {
  if (!Number.isSafeInteger(minor)) throw new RangeError("Money must be a safe integer of minor units.");
}

/** The exact decimal string for an amount, such as "-1500.05". */
function toDecimalString(minor: number, currency: Currency): string {
  const exponent = CURRENCY_EXPONENT[currency];
  const digits = Math.abs(minor).toString().padStart(exponent + 1, "0");
  const sign = minor < 0 ? "-" : "";
  if (exponent === 0) return sign + digits;
  return `${sign}${digits.slice(0, -exponent)}.${digits.slice(-exponent)}`;
}

/**
 * An amount as form input text, with no symbol or grouping: 1500000 NZD is
 * "15000.00". `parseMoney` reads it back to the same minor units.
 */
export function minorToInput(minor: number, currency: Currency): string {
  assertSafeMinor(minor);
  return toDecimalString(minor, currency);
}

/**
 * Formats minor units for display. Server only: the Intl output is passed to
 * client components already formatted. A decimal string keeps Intl exact.
 */
export function formatMoney(minor: number, currency: Currency): string {
  assertSafeMinor(minor);
  const formatter = new Intl.NumberFormat(CURRENCY_LOCALE[currency], { style: "currency", currency });
  return formatter.format(toDecimalString(minor, currency) as unknown as number);
}

/** Converts a Prisma `BigInt` column to a number, rejecting unsafe values. */
export function minorFromDb(value: bigint): number {
  const minor = Number(value);
  assertSafeMinor(minor);
  return minor;
}

/** Converts a safe integer of minor units to the `BigInt` Prisma writes. */
export function minorToDb(minor: number): bigint {
  assertSafeMinor(minor);
  return BigInt(minor);
}

const BPS_PER_WHOLE = BigInt(10000);

/** Hands out `extra` single units to the indexes with the largest remainders; ties go to the later index. */
function distributeRemainder(shares: bigint[], remainders: bigint[], extra: bigint): number[] {
  const order = remainders
    .map((remainder, index) => ({ remainder, index }))
    .sort((a, b) => (a.remainder === b.remainder ? b.index - a.index : a.remainder > b.remainder ? -1 : 1));
  const result = [...shares];
  for (let i = 0; BigInt(i) < extra; i += 1) result[order[i].index] += BigInt(1);
  return result.map(Number);
}

/**
 * Splits `totalMinor` by basis points with the largest-remainder method. The
 * shares sum exactly to the total times Σbps / 10000, rounded half up; each is
 * within one minor unit of its exact value; ties go to the later share. A share
 * can be 0 when the total is tiny, so callers that store it must check.
 */
export function allocate(totalMinor: number, bpsList: readonly number[]): number[] {
  if (!Number.isSafeInteger(totalMinor) || totalMinor <= 0) throw new RangeError("The total must be a positive safe integer.");
  if (bpsList.length === 0) throw new RangeError("Allocate needs at least one share.");
  if (bpsList.some((bps) => !Number.isInteger(bps) || bps < 1 || bps > 10000)) {
    throw new RangeError("Basis points must be whole numbers from 1 to 10000.");
  }
  const sumBps = bpsList.reduce((sum, bps) => sum + bps, 0);
  if (sumBps > 10000) throw new RangeError("Basis points cannot add up to more than 10000.");

  const total = BigInt(totalMinor);
  const shares = bpsList.map((bps) => (total * BigInt(bps)) / BPS_PER_WHOLE);
  const remainders = bpsList.map((bps) => (total * BigInt(bps)) % BPS_PER_WHOLE);
  const target = (total * BigInt(sumBps) + BPS_PER_WHOLE / BigInt(2)) / BPS_PER_WHOLE;
  const floored = shares.reduce((sum, share) => sum + share, BigInt(0));
  return distributeRemainder(shares, remainders, target - floored);
}

/**
 * Splits a whole number into `parts` near-equal whole numbers that sum exactly
 * to it, with the leftover units on the later parts: 7000 over 3 is
 * [2333, 2333, 2334].
 */
export function splitEvenly(amount: number, parts: number): number[] {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError("The amount must be a non-negative safe integer.");
  if (!Number.isInteger(parts) || parts < 1) throw new RangeError("Split into at least one part.");
  const base = Math.floor(amount / parts);
  const leftover = amount - base * parts;
  return Array.from({ length: parts }, (_, index) => base + (index >= parts - leftover ? 1 : 0));
}
