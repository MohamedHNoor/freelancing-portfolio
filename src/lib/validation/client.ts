import { z } from "zod";
import { currencySchema } from "@/lib/validation/money";

function maxMessage(max: number): string {
  return `Use at most ${max.toLocaleString("en-NZ")} characters.`;
}

/** Trimmed, at most `max` characters, and null when left empty. */
function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, maxMessage(max))
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));
}

export const clientInputSchema = z.object({
  name: z
    .string({ required_error: "Enter the contact's name." })
    .trim()
    .min(1, "Enter the contact's name.")
    .max(120, maxMessage(120)),
  email: z
    .string({ required_error: "Enter a valid email address." })
    .trim()
    .toLowerCase()
    .max(254, "Enter a valid email address.")
    .email("Enter a valid email address."),
  phone: optionalText(40),
  companyName: optionalText(160),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => value === "" || /^[A-Z]{2}$/.test(value), "Use a two-letter country code, such as NZ.")
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  defaultCurrency: currencySchema,
  addressLine1: optionalText(200),
  addressLine2: optionalText(200),
  city: optionalText(100),
  region: optionalText(100),
  postalCode: optionalText(20),
  notes: optionalText(5000),
});

export type ClientInput = z.input<typeof clientInputSchema>;
export type ClientValues = z.output<typeof clientInputSchema>;
export type ClientField = keyof ClientValues;

/** Every editable field, in form order. Activity records list changes in this order. */
export const CLIENT_FIELDS = [
  "name",
  "email",
  "phone",
  "companyName",
  "countryCode",
  "defaultCurrency",
  "addressLine1",
  "addressLine2",
  "city",
  "region",
  "postalCode",
  "notes",
] as const satisfies readonly ClientField[];

export const clientFieldSchema = z.enum(CLIENT_FIELDS);
