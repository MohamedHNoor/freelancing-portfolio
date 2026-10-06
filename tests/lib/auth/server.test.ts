import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createNeonAuth = vi.hoisted(() => vi.fn<(config: unknown) => object>());

vi.mock("server-only", () => ({}));
vi.mock("@neondatabase/auth/next/server", () => ({ createNeonAuth }));

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
