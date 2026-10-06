"use server";

import type { ZodError } from "zod";
import { getAuth } from "@/lib/auth/server";
import { ownerUserId } from "@/lib/auth/owner";
import { getAuthEnv } from "@/lib/env";
import { absoluteUrl } from "@/lib/site";
import {
  emailOnlySchema,
  resetPasswordSchema,
  signInSchema,
} from "@/lib/validation/auth";
import type { ActionErrorCode, ActionFailure, ActionResult } from "@/types/action";

const MESSAGES: Record<ActionErrorCode, string> = {
  VALIDATION: "Some of those details need another look.",
  INVALID_CREDENTIALS: "That email and password don't match an account.",
  EMAIL_NOT_VERIFIED: "Verify your email address first. Check your inbox for the link.",
  INVALID_TOKEN: "This link is invalid or has expired. Request a new one.",
  UNAUTHENTICATED: "Please sign in again.",
  UNEXPECTED: "Something went wrong. Please try again in a moment.",
};

type ProviderError = { code?: unknown; status?: unknown } | null | undefined;

function fail(code: ActionErrorCode, fieldErrors?: Record<string, string[]>): ActionFailure {
  return { success: false, data: null, error: { code, message: MESSAGES[code], ...(fieldErrors ? { fieldErrors } : {}) } };
}

function invalid(error: ZodError): ActionFailure {
  return fail("VALIDATION", error.flatten().fieldErrors as Record<string, string[]>);
}

function providerCode(error: ProviderError): string {
  return String(error?.code ?? error?.status ?? "unknown");
}

/* Codes only: never an email address, password, token, cookie or provider message. */
function logFailure(action: string, code: string): void {
  console.error(`[auth] ${action} failed: ${code}`);
}

function thrownCode(error: unknown): string {
  return error instanceof Error ? error.name : "unknown";
}

export async function signIn(raw: unknown): Promise<ActionResult<{ redirectTo: "/dashboard" }>> {
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return invalid(parsed.error);
  const { email, password } = parsed.data;

  try {
    const { ownerEmail } = getAuthEnv();
    const auth = getAuth();
    const { data, error } = await auth.signIn.email({ email, password });

    if (error) {
      const code = providerCode(error);
      if (code === "EMAIL_NOT_VERIFIED" || error.status === 403) {
        // Only the owner learns that verification is the problem.
        return email === ownerEmail ? fail("EMAIL_NOT_VERIFIED") : fail("INVALID_CREDENTIALS");
      }
      if (code === "INVALID_EMAIL_OR_PASSWORD" || error.status === 401) return fail("INVALID_CREDENTIALS");
      logFailure("signIn", code);
      return fail("UNEXPECTED");
    }

    if (ownerUserId(data, ownerEmail) === null) {
      // Sign-up is closed, so this should not happen; if it does, no session survives.
      await auth.signOut();
      return fail("INVALID_CREDENTIALS");
    }
    return { success: true, data: { redirectTo: "/dashboard" }, error: null };
  } catch (error) {
    logFailure("signIn", thrownCode(error));
    return fail("UNEXPECTED");
  }
}

export async function signOut(): Promise<ActionResult<{ signedOut: true }>> {
  try {
    // An error here means there was no session to end, which is the goal anyway.
    await getAuth().signOut();
    return { success: true, data: { signedOut: true }, error: null };
  } catch (error) {
    logFailure("signOut", thrownCode(error));
    return fail("UNEXPECTED");
  }
}

/** The same answer for every well-formed address, so no request reveals which
 *  accounts exist. Only the owner's address reaches Neon. */
async function ownerEmailRequest(
  action: string,
  raw: unknown,
  send: (email: string) => Promise<{ error: ProviderError }>,
): Promise<ActionResult<{ sent: true }>> {
  const parsed = emailOnlySchema.safeParse(raw);
  if (!parsed.success) return invalid(parsed.error);

  try {
    if (parsed.data.email === getAuthEnv().ownerEmail) {
      const { error } = await send(parsed.data.email);
      if (error) logFailure(action, providerCode(error));
    }
  } catch (error) {
    logFailure(action, thrownCode(error));
  }
  return { success: true, data: { sent: true }, error: null };
}

export async function requestPasswordReset(raw: unknown): Promise<ActionResult<{ sent: true }>> {
  return ownerEmailRequest("requestPasswordReset", raw, (email) =>
    getAuth().requestPasswordReset({ email, redirectTo: absoluteUrl("/reset-password") }),
  );
}

export async function resendVerification(raw: unknown): Promise<ActionResult<{ sent: true }>> {
  return ownerEmailRequest("resendVerification", raw, (email) =>
    getAuth().sendVerificationEmail({ email, callbackURL: absoluteUrl("/verify-email") }),
  );
}

export async function resetPassword(raw: unknown): Promise<ActionResult<{ reset: true }>> {
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const { error } = await getAuth().resetPassword({
      newPassword: parsed.data.password,
      token: parsed.data.token,
    });
    if (error) {
      const code = providerCode(error);
      if (code === "INVALID_TOKEN" || code === "TOKEN_EXPIRED") return fail("INVALID_TOKEN");
      if (code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG") {
        return fail("VALIDATION", { password: ["That password does not meet the requirements."] });
      }
      logFailure("resetPassword", code);
      return fail("UNEXPECTED");
    }
    return { success: true, data: { reset: true }, error: null };
  } catch (error) {
    logFailure("resetPassword", thrownCode(error));
    return fail("UNEXPECTED");
  }
}
