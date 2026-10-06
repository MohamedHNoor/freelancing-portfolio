import { describe, expect, it } from "vitest";
import { isOwnerSession, ownerUserId } from "@/lib/auth/owner";

const OWNER = "owner@example.com";
const user = { id: "8f6c2a3e-0b1d-4e5f-9a7b-1c2d3e4f5a6b", email: OWNER, emailVerified: true };

describe("ownerUserId", () => {
  it("returns the id for the verified owner", () => {
    expect(ownerUserId({ user }, OWNER)).toBe(user.id);
    expect(isOwnerSession({ user }, OWNER)).toBe(true);
  });

  it("matches across case and surrounding whitespace", () => {
    expect(ownerUserId({ user: { ...user, email: "  Owner@Example.COM " } }, OWNER)).toBe(user.id);
  });

  it.each([
    ["another account", { user: { ...user, email: "someone@example.com" } }],
    ["an unverified owner", { user: { ...user, emailVerified: false } }],
    ["a truthy but non-boolean verification flag", { user: { ...user, emailVerified: "true" } }],
    ["a missing id", { user: { ...user, id: "" } }],
    ["a missing email", { user: { ...user, email: undefined } }],
    ["no user", { user: null }],
    ["no session", null],
    ["undefined", undefined],
  ])("rejects %s", (_label, session) => {
    expect(ownerUserId(session, OWNER)).toBeNull();
    expect(isOwnerSession(session, OWNER)).toBe(false);
  });
});
