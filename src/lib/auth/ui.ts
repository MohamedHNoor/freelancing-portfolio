import { resetPasswordSchema } from "@/lib/validation/auth";

/** The callback token is opaque. Arrays, missing values and invalid lengths
 * never reach the password-reset action. */
export function parseResetToken(value: unknown): string | null {
  const parsed = resetPasswordSchema.shape.token.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** The installed provider returns one token, or this fixed expired-link error. */
export function resetTokenFromQuery(query: { token?: unknown; error?: unknown }): string | null {
  return query.error === "INVALID_TOKEN" ? null : parseResetToken(query.token);
}

/** After a reset, the form lands on `/login?reset=done`. Only that exact value
 *  shows a fixed notice; nothing from the query is ever displayed. */
export const PASSWORD_SAVED_NOTICE = "Password saved. Sign in with your new password.";

export function loginNotice(query: { reset?: unknown }): string | null {
  return query.reset === "done" ? PASSWORD_SAVED_NOTICE : null;
}

/** Map only this form's visible fields, in their focus order. */
export function knownFieldErrors<Field extends string>(
  errors: Record<string, string[]> | undefined,
  fields: readonly Field[],
): { field: Field; message: string }[] {
  const result: { field: Field; message: string }[] = [];
  for (const field of fields) {
    if (!errors || !Object.hasOwn(errors, field)) continue;
    const message = errors[field]?.[0];
    if (message) result.push({ field, message });
  }
  return result;
}
