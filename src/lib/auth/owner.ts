/** The shape the owner rule reads; the SDK's session and sign-in results fit it. */
export type SessionLike =
  | {
      user?: {
        id?: unknown;
        email?: unknown;
        emailVerified?: unknown;
      } | null;
    }
  | null
  | undefined;

/** The session's user id when it belongs to the verified owner, otherwise null.
 *  `ownerEmail` arrives already trimmed and lowercased from `getAuthEnv()`. */
export function ownerUserId(session: SessionLike, ownerEmail: string): string | null {
  const user = session?.user;
  if (
    !user ||
    typeof user.id !== "string" ||
    user.id === "" ||
    typeof user.email !== "string" ||
    user.emailVerified !== true
  ) {
    return null;
  }
  return user.email.trim().toLowerCase() === ownerEmail ? user.id : null;
}

export function isOwnerSession(session: SessionLike, ownerEmail: string): boolean {
  return ownerUserId(session, ownerEmail) !== null;
}
