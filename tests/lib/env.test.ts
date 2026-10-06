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
