import { z } from "zod";

const emailSchema = z
  .string({ required_error: "Enter your email address." })
  .trim()
  .toLowerCase()
  .max(254, "That email address is too long.")
  .email("Enter a valid email address.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "Enter your password." })
    .min(1, "Enter your password.")
    .max(128, "That password is too long."),
});

/** Used by both "forgot password" and "resend verification". */
export const emailOnlySchema = z.object({ email: emailSchema });

/* Twelve is the app's own floor. Neon may enforce more, which the action
   reports as a validation error rather than a generic failure. */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "This reset link is incomplete.").max(512, "This reset link is invalid."),
  password: z
    .string({ required_error: "Choose a new password." })
    .min(12, "Use at least 12 characters.")
    .max(128, "Use at most 128 characters."),
});

export type SignInInput = z.input<typeof signInSchema>;
export type EmailOnlyInput = z.input<typeof emailOnlySchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
