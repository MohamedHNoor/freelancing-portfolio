"use server";

import { cookies, headers } from "next/headers";
import type { ZodError } from "zod";
import { NEON_AUTH_COOKIE_PREFIX } from "@neondatabase/auth/server";
import { getAuth } from "@/lib/auth/server";
import { ownerUserId } from "@/lib/auth/owner";
import { getAuthEnv } from "@/lib/env";
import { checkRateLimit, clientKey, type RateLimitStore } from "@/lib/rate-limit";
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

/** The SDK's sign-out reads cookies from the incoming request, so it cannot
 *  see a session this same action just created. Expire every Neon Auth cookie
 *  directly; `__Secure-` cookies are only replaced when the write is Secure. */
async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  for (const { name } of cookieStore.getAll()) {
    if (name.startsWith(NEON_AUTH_COOKIE_PREFIX)) {
      cookieStore.set(name, "", { maxAge: 0, path: "/", secure: true, httpOnly: true, sameSite: "lax" });
    }
  }
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
      if (code === "email_not_confirmed" || code === "EMAIL_NOT_VERIFIED") {
        // Only the owner learns that verification is the problem.
        return email === ownerEmail ? fail("EMAIL_NOT_VERIFIED") : fail("INVALID_CREDENTIALS");
      }
      if (code === "invalid_credentials" || code === "INVALID_EMAIL_OR_PASSWORD" || code === "INVALID_PASSWORD" || error.status === 401) return fail("INVALID_CREDENTIALS");
      logFailure("signIn", code);
      return fail("UNEXPECTED");
    }

    if (ownerUserId(data, ownerEmail) === null) {
      // Sign-up is closed, so this should not happen. If it does, the browser
      // keeps no session. Upstream revocation is best-effort: the SDK's
      // sign-out cannot carry the new token (see `clearAuthCookies`).
      const { error: signOutError } = await auth.signOut();
      if (signOutError) logFailure("signIn.nonOwnerSignOut", providerCode(signOutError));
      await clearAuthCookies();
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

/* Reset and verification emails per visitor and action. Like the contact
   form's limiter this is per-instance and only raises the cost of a naive
   script; the upstream applies its own limits. */
const EMAIL_REQUEST_LIMIT = 3;
const EMAIL_REQUEST_WINDOW_MS = 15 * 60 * 1000;
const emailRequests: RateLimitStore = new Map();

async function emailRequestAllowed(action: string): Promise<boolean> {
  const key = clientKey((await headers()).get("x-forwarded-for"));
  if (key === null) return true;
  return checkRateLimit(emailRequests, `${action}:${key}`, Date.now(), EMAIL_REQUEST_LIMIT, EMAIL_REQUEST_WINDOW_MS).allowed;
}

/** The same answer for every well-formed address, so no request reveals which
 *  accounts exist. Only the owner's address reaches Neon, and a visitor over
 *  the limit gets the same answer with nothing sent. */
async function ownerEmailRequest(
  action: string,
  raw: unknown,
  send: (email: string) => Promise<{ error: ProviderError }>,
): Promise<ActionResult<{ sent: true }>> {
  const parsed = emailOnlySchema.safeParse(raw);
  if (!parsed.success) return invalid(parsed.error);

  try {
    if (!(await emailRequestAllowed(action))) {
      logFailure(action, "rate_limited");
    } else if (parsed.data.email === getAuthEnv().ownerEmail) {
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
      if (code === "bad_jwt" || code === "INVALID_TOKEN" || code === "TOKEN_EXPIRED") return fail("INVALID_TOKEN");
      if (code === "weak_password" || code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG") {
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
