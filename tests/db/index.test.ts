import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PoolConfig } from "pg";

const mocks = vi.hoisted(() => ({
  pool: vi.fn<(options: PoolConfig) => { query: () => Promise<unknown> }>(),
  attach: vi.fn<(pool: unknown) => void>(),
  drizzle: vi.fn<(options: unknown) => { execute: (query: unknown) => Promise<unknown> }>(),
  env: vi.fn<() => { databaseUrl: string }>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("pg", () => ({ Pool: mocks.pool }));
vi.mock("@vercel/functions", () => ({ attachDatabasePool: mocks.attach }));
vi.mock("drizzle-orm/node-postgres", () => ({ drizzle: mocks.drizzle }));
vi.mock("@/lib/env", () => ({ getDatabaseEnv: mocks.env }));

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  mocks.env.mockReturnValue({ databaseUrl: "postgres://runtime:fixture@db.example/app" });
  mocks.pool.mockImplementation(function Pool() { return { query: vi.fn<() => Promise<unknown>>() }; });
  mocks.drizzle.mockReturnValue({ execute: vi.fn<(query: unknown) => Promise<unknown>>() });
});

afterEach(() => vi.unstubAllEnvs());

describe("getDb", () => {
  it("does nothing on import and initializes one attached pool on first use", async () => {
    vi.stubEnv("DATABASE_URL", undefined);
    const { getDb } = await import("@/db");
    expect(mocks.env).not.toHaveBeenCalled();
    expect(mocks.pool).not.toHaveBeenCalled();
    expect(mocks.attach).not.toHaveBeenCalled();
    expect(mocks.drizzle).not.toHaveBeenCalled();

    const first = getDb();
    expect(getDb()).toBe(first);
    expect(mocks.env).toHaveBeenCalledTimes(1);
    expect(mocks.pool).toHaveBeenCalledExactlyOnceWith({
      connectionString: "postgres://runtime:fixture@db.example/app", max: 5, idleTimeoutMillis: 5000,
    });
    const pool = mocks.pool.mock.results[0].value;
    expect(mocks.attach).toHaveBeenCalledExactlyOnceWith(pool);
    expect(mocks.drizzle).toHaveBeenCalledExactlyOnceWith({
      client: pool, schema: await import("@/db/schema"), casing: "snake_case",
    });
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("validates before creating a pool and allows a corrected configuration to retry", async () => {
    mocks.env.mockImplementationOnce(() => { throw new Error("DATABASE_URL must be configured"); });
    const { getDb } = await import("@/db");
    expect(() => getDb()).toThrow("DATABASE_URL must be configured");
    expect(mocks.pool).not.toHaveBeenCalled();
    expect(mocks.attach).not.toHaveBeenCalled();
    expect(() => getDb()).not.toThrow();
    expect(mocks.pool).toHaveBeenCalledTimes(1);
  });

  it("never selects migration or test configuration", async () => {
    vi.stubEnv("DATABASE_URL_UNPOOLED", "postgres://db.example/direct");
    vi.stubEnv("TEST_DATABASE_URL", "postgres://db.example/test");
    const { getDb } = await import("@/db");
    getDb();
    expect(mocks.pool.mock.calls[0][0].connectionString).toBe("postgres://runtime:fixture@db.example/app");
  });

  it("propagates unexpected initialization and query failures", async () => {
    const failure = new Error("fixture driver failure");
    mocks.pool.mockImplementationOnce(function Pool() { throw failure; });
    const { getDb } = await import("@/db");
    expect(() => getDb()).toThrow(failure);
    const query = vi.fn().mockRejectedValue(failure);
    mocks.drizzle.mockReturnValue({ execute: query });
    await expect(getDb().execute("fixture")).rejects.toBe(failure);
  });
});
