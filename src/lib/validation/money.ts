import { z } from "zod";
import { CURRENCIES, parseMoney, type Currency } from "@/lib/money";

export const currencySchema = z.enum(CURRENCIES, {
  errorMap: () => ({ message: "Choose a currency." }),
});

/** A browser-supplied record id. Never trusted until it parses. */
export const idSchema = z.string().uuid();

/** An entered amount, as text, converted to positive minor units of `currency`. */
export function moneyInputSchema(currency: Currency) {
  return z
    .string({ required_error: "Enter an amount." })
    .transform((value, ctx) => {
      const minor = parseMoney(value, currency);
      if (minor === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter an amount such as 1,500.00." });
        return z.NEVER;
      }
      if (minor <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter an amount greater than zero." });
        return z.NEVER;
      }
      return minor;
    });
}

const PERCENT_PATTERN = /^(\d{1,3})(?:\.(\d{1,2}))?$/;

/** An entered percentage such as "12.5", as integer basis points (1250). More than 0, at most 100, two decimals. */
export const percentInputSchema = z
  .string({ required_error: "Enter a percentage." })
  .trim()
  .transform((value, ctx) => {
    const match = PERCENT_PATTERN.exec(value);
    if (match === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a percentage such as 30 or 12.5." });
      return z.NEVER;
    }
    const bps = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
    if (bps <= 0 || bps > 10000) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a percentage above 0 and at most 100." });
      return z.NEVER;
    }
    return bps;
  });

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar date in `YYYY-MM-DD` form. */
function isCalendarDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (match === null) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** An optional calendar date as `YYYY-MM-DD`, or null when left empty. */
export const dateInputSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || isCalendarDate(value), "Enter a date as YYYY-MM-DD.")
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));
