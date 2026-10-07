import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* The real SDK server with only `fetch` and `next/headers` stubbed: once the
   session-data cache is missing, `getSession()` goes upstream, and an upstream
   `Set-Cookie` must not turn into a cookie write while a page renders. */
const headerStore = vi.hoisted(() => ({
  current: new Headers({ cookie: "__Secure-neon-auth.session_token=signed-token" }),
}));
const renderCookieWrite = vi.hoisted(() => vi.fn(() => {
  throw new Error("Cookies can only be modified in a Server Action or Route Handler.");
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => headerStore.current,
  cookies: async () => ({ set: renderCookieWrite }),
}));

const session = {
  session: { id: "s1", userId: "u1", token: "t", expiresAt: new Date(Date.now() + 3_600_000).toISOString() },
  user: { id: "u1", email: "owner@example.com", emailVerified: true },
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEON_AUTH_BASE_URL", "https://ep-fixture.neonauth.ap-southeast-2.aws.neon.tech/neondb/auth");
  vi.stubEnv("NEON_AUTH_COOKIE_SECRET", "c".repeat(32));
  vi.stubEnv("OWNER_EMAIL", "owner@example.com");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(session), {
    status: 200,
    headers: [
      ["content-type", "application/json"],
      ["set-cookie", "__Secure-neon-auth.session_token=signed-token; Path=/; HttpOnly; Secure; SameSite=Lax"],
    ],
  })));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("session reader during render", () => {
  it("returns the upstream session without writing the refreshed cookies", async () => {
    const { getSessionReader } = await import("@/lib/auth/server");
    const { data, error } = await getSessionReader().getSession();
    expect(error).toBeNull();
    expect(data?.user?.email).toBe("owner@example.com");
    const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(urls.some((url) => url.endsWith("/neondb/auth/get-session"))).toBe(true);
    expect(renderCookieWrite).not.toHaveBeenCalled();
  });

  it("would throw through the default Next adapter, which is why pages use the reader", async () => {
    const { getAuth } = await import("@/lib/auth/server");
    await expect(getAuth().getSession()).rejects.toThrow("Cookies can only be modified");
  });
});
