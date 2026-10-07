import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/server", () => ({ getSessionReader: () => ({ getSession: mocks.getSession }) }));

const OWNER_ID = "8f6c2a3e-0b1d-4e5f-9a7b-1c2d3e4f5a6b";
const ownerSession = { user: { id: OWNER_ID, email: "Owner@Example.com", emailVerified: true } };

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("NEON_AUTH_BASE_URL", "https://ep-fixture.neonauth.ap-southeast-2.aws.neon.tech/neondb/auth");
  vi.stubEnv("NEON_AUTH_COOKIE_SECRET", "c".repeat(32));
  vi.stubEnv("OWNER_EMAIL", "owner@example.com");
});

afterEach(() => vi.unstubAllEnvs());

describe("getOwner", () => {
  it("returns the owner's id for a verified owner session", async () => {
    mocks.getSession.mockResolvedValue({ data: ownerSession, error: null });
    const { getOwner } = await import("@/server/auth/session");
    expect(await getOwner()).toEqual({ userId: OWNER_ID });
  });

  it.each([
    ["no session", null],
    ["another account", { user: { ...ownerSession.user, email: "someone@example.com" } }],
    ["an unverified owner", { user: { ...ownerSession.user, emailVerified: false } }],
  ])("returns null for %s", async (_label, data) => {
    mocks.getSession.mockResolvedValue({ data, error: null });
    const { getOwner } = await import("@/server/auth/session");
    expect(await getOwner()).toBeNull();
  });

  it("treats a failed session lookup as unexpected, carrying only a code", async () => {
    mocks.getSession.mockResolvedValue({ data: null, error: { status: 502, message: "upstream body with private detail" } });
    const { getOwner } = await import("@/server/auth/session");
    const failure = await getOwner().catch((error: unknown) => error);
    expect(String(failure)).toContain("502");
    expect(String(failure)).not.toContain("private");
  });

  it("propagates a thrown SDK failure and missing configuration", async () => {
    mocks.getSession.mockRejectedValue(new Error("network down"));
    const { getOwner } = await import("@/server/auth/session");
    await expect(getOwner()).rejects.toThrow("network down");
    vi.stubEnv("OWNER_EMAIL", undefined);
    await expect((await import("@/server/auth/session")).getOwner()).rejects.toThrow("OWNER_EMAIL must be");
  });
});

describe("requireOwner and requireOwnerForAction", () => {
  it("passes the owner through", async () => {
    mocks.getSession.mockResolvedValue({ data: ownerSession, error: null });
    const session = await import("@/server/auth/session");
    expect(await session.requireOwner()).toEqual({ userId: OWNER_ID });
    expect(await session.requireOwnerForAction()).toEqual({ userId: OWNER_ID });
  });

  it("redirects pages to sign-in and returns UNAUTHENTICATED to actions", async () => {
    mocks.getSession.mockResolvedValue({ data: null, error: null });
    const session = await import("@/server/auth/session");
    await expect(session.requireOwner()).rejects.toThrow("NEXT_REDIRECT /login");
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
    expect(await session.requireOwnerForAction()).toEqual({
      success: false,
      data: null,
      error: { code: "UNAUTHENTICATED", message: "Please sign in again." },
    });
  });
});
