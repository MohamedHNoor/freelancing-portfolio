import { z } from "zod";

export function maxMessage(max: number): string {
  return `Use at most ${max.toLocaleString("en-NZ")} characters.`;
}

/** Trimmed, at most `max` characters, and null when left empty. */
export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, maxMessage(max))
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));
}

/** Trimmed, 1 to `max` characters. */
export function requiredText(max: number, emptyMessage: string) {
  return z.string({ required_error: emptyMessage }).trim().min(1, emptyMessage).max(max, maxMessage(max));
}
