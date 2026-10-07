import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createNeonAuth = vi.hoisted(() => vi.fn<(config: unknown) => object>());
const createAuthServer = vi.hoisted(() => vi.fn<(config: unknown) => object>(() => ({ reader: true })));
const headerStore = vi.hoisted(() => ({ current: new Headers() }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => headerStore.current }));
vi.mock("@neondatabase/auth/next/server", () => ({ createNeonAuth }));
vi.mock("@neondatabase/auth/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@neondatabase/auth/server")>()),
  createAuthServer,
}));

const ENV = {
  NEON_AUTH_BASE_URL: "https://ep-fixture.neonauth.ap-southeast-2.aws.neon.tech/neondb/auth",
  NEON_AUTH_COOKIE_SECRET: "c".repeat(32),
  OWNER_EMAIL: "owner@example.com",
};

beforeEach(() => {
  vi.resetModules();
  createNeonAuth.mockReset();
  createNeonAuth.mockImplementation(() => ({ fixture: true }));
});

afterEach(() => vi.unstubAllEnvs());

describe("getAuth", () => {
  it("reads no env and builds nothing on import, then builds one instance on first use", async () => {
    for (const key of Object.keys(ENV)) vi.stubEnv(key, undefined);
    const { getAuth } = await import("@/lib/auth/server");
    expect(createNeonAuth).not.toHaveBeenCalled();

    for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value);
    const first = getAuth();
    expect(getAuth()).toBe(first);
    expect(createNeonAuth).toHaveBeenCalledExactlyOnceWith({
      baseUrl: ENV.NEON_AUTH_BASE_URL,
      cookies: { secret: ENV.NEON_AUTH_COOKIE_SECRET, sessionDataTtl: 60 },
      logLevel: "silent",
    });
  });

  it("validates before building and lets a corrected configuration retry", async () => {
    for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, key === "NEON_AUTH_COOKIE_SECRET" ? "short" : value);
    const { getAuth } = await import("@/lib/auth/server");
    expect(() => getAuth()).toThrow("NEON_AUTH_COOKIE_SECRET must be");
    expect(createNeonAuth).not.toHaveBeenCalled();
    vi.stubEnv("NEON_AUTH_COOKIE_SECRET", ENV.NEON_AUTH_COOKIE_SECRET);
    expect(() => getAuth()).not.toThrow();
  });
});

describe("getSessionReader", () => {
  it("builds one reader with the read-only context and the same cache settings", async () => {
    for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value);
    const { getSessionReader, readOnlyRequestContext } = await import("@/lib/auth/server");
    expect(getSessionReader()).toBe(getSessionReader());
    expect(createAuthServer).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      baseUrl: ENV.NEON_AUTH_BASE_URL,
      context: readOnlyRequestContext,
      cookieSecret: ENV.NEON_AUTH_COOKIE_SECRET,
      sessionDataTtl: 60,
    }));
  });
});

describe("readOnlyRequestContext", () => {
  it("forwards only Neon Auth cookies and the origin, and drops every cookie write", async () => {
    headerStore.current = new Headers({
      cookie: "__Secure-neon-auth.session_token=t; theme=dark; __Secure-neon-auth.local.session_data=d",
      origin: "http://localhost:3000",
    });
    const { readOnlyRequestContext } = await import("@/lib/auth/server");
    const context = await readOnlyRequestContext();
    expect(context.getCookies()).toBe("__Secure-neon-auth.session_token=t; __Secure-neon-auth.local.session_data=d");
    expect(context.getOrigin()).toBe("http://localhost:3000");
    expect(context.getHeader("origin")).toBe("http://localhost:3000");
    expect(context.getFramework()).toBe("nextjs");
    // A write during render would throw in Next; here it must be a silent no-op.
    expect(() => context.setCookie("__Secure-neon-auth.local.session_data", "x", { path: "/" })).not.toThrow();
  });

  it("reports an empty origin and no cookies when the request has none", async () => {
    headerStore.current = new Headers();
    const { readOnlyRequestContext } = await import("@/lib/auth/server");
    const context = await readOnlyRequestContext();
    expect(context.getCookies()).toBe("");
    expect(context.getOrigin()).toBe("");
  });
});
