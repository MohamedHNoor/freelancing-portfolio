import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";
import { ownerUserId } from "@/lib/auth/owner";
import { getAuthEnv } from "@/lib/env";
import type { ActionFailure } from "@/types/action";

export const LOGIN_PATH = "/login";

export type Owner = { userId: string };

export class AuthServiceError extends Error {
  constructor(readonly code: string) {
    super(`Auth service failed (${code}).`);
    this.name = "AuthServiceError";
  }
}

/** The verified owner for this request, or null for anyone else. A failed
 *  session lookup is an unexpected error, never a quiet "signed out". */
export const getOwner = cache(async (): Promise<Owner | null> => {
  const { ownerEmail } = getAuthEnv();
  const { data, error } = await getAuth().getSession();
  if (error) throw new AuthServiceError(String(error.code ?? error.status ?? "unknown"));
  const userId = ownerUserId(data, ownerEmail);
  return userId === null ? null : { userId };
});

/** For pages: the owner, or a redirect to sign-in. */
export async function requireOwner(): Promise<Owner> {
  const owner = await getOwner();
  if (owner === null) redirect(LOGIN_PATH);
  return owner;
}

export const UNAUTHENTICATED: ActionFailure = {
  success: false,
  data: null,
  error: { code: "UNAUTHENTICATED", message: "Please sign in again." },
};

/** For Server Actions: the owner, or the `UNAUTHENTICATED` result to return. */
export async function requireOwnerForAction(): Promise<Owner | ActionFailure> {
  return (await getOwner()) ?? UNAUTHENTICATED;
}
