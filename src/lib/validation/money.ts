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
