import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("database environment", () => {
  it("imports without validating absent configuration", async () => {
    vi.stubEnv("DATABASE_URL", undefined);
    const { getDatabaseEnv } = await import("@/lib/env");
    expect(() => getDatabaseEnv()).toThrow("DATABASE_URL must be");
  });

  it("uses only the runtime URL and reads lazily", async () => {
    vi.stubEnv("DATABASE_URL", undefined);
    vi.stubEnv("DATABASE_URL_UNPOOLED", "invalid-direct-url");
    vi.stubEnv("TEST_DATABASE_URL", "invalid-test-url");
    const { getDatabaseEnv } = await import("@/lib/env");
    const runtime = "postgres://runtime:fixture-password@db.example/app";
    vi.stubEnv("DATABASE_URL", runtime);
    expect(getDatabaseEnv()).toEqual({ databaseUrl: runtime });
  });

  it("never falls back to direct or test configuration", async () => {
    vi.stubEnv("DATABASE_URL", undefined);
    vi.stubEnv("DATABASE_URL_UNPOOLED", "postgres://db.example/direct");
    vi.stubEnv("TEST_DATABASE_URL", "postgres://db.example/test");
    const { getDatabaseEnv } = await import("@/lib/env");
    expect(() => getDatabaseEnv()).toThrow("DATABASE_URL must be");
  });
});

describe("auth environment", () => {
  const valid = {
    NEON_AUTH_BASE_URL: "https://ep-fixture.neonauth.ap-southeast-2.aws.neon.tech/neondb/auth",
    NEON_AUTH_COOKIE_SECRET: "c".repeat(32),
    OWNER_EMAIL: " Owner@Example.com ",
  };

  it("imports without validating and parses all three variables on use", async () => {
    for (const key of Object.keys(valid)) vi.stubEnv(key, undefined);
    const { getAuthEnv } = await import("@/lib/env");
    expect(() => getAuthEnv()).toThrow("NEON_AUTH_BASE_URL must be");
    for (const [key, value] of Object.entries(valid)) vi.stubEnv(key, value);
    expect(getAuthEnv()).toEqual({
      baseUrl: valid.NEON_AUTH_BASE_URL,
      cookieSecret: valid.NEON_AUTH_COOKIE_SECRET,
      ownerEmail: "owner@example.com",
    });
  });

  it.each(["NEON_AUTH_COOKIE_SECRET", "OWNER_EMAIL"])("fails closed when %s is missing", async (missing) => {
    for (const [key, value] of Object.entries(valid)) vi.stubEnv(key, key === missing ? undefined : value);
    const { getAuthEnv } = await import("@/lib/env");
    expect(() => getAuthEnv()).toThrow(`${missing} must be`);
  });
});
