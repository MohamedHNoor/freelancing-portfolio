import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PoolConfig } from "pg";

type FixtureClient = { $queryRawUnsafe: (query: string) => Promise<unknown> };

const mocks = vi.hoisted(() => ({
  pool: vi.fn<(options: PoolConfig) => { query: () => Promise<unknown> }>(),
  attach: vi.fn<(pool: unknown) => void>(),
  adapter: vi.fn<(pool: unknown) => object>(),
  client: vi.fn<(options: { adapter: unknown }) => FixtureClient>(),
  env: vi.fn<() => { databaseUrl: string }>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("pg", () => ({ Pool: mocks.pool }));
vi.mock("@vercel/functions", () => ({ attachDatabasePool: mocks.attach }));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: mocks.adapter }));
vi.mock("@/generated/prisma/client", () => ({ PrismaClient: mocks.client }));
vi.mock("@/lib/env", () => ({ getDatabaseEnv: mocks.env }));

function clientReturning(client: FixtureClient) {
  return function PrismaClient() { return client; };
}

const globalForDb = globalThis as unknown as { portfolioDb?: unknown };

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  delete globalForDb.portfolioDb;
  mocks.env.mockReturnValue({ databaseUrl: "postgres://runtime:fixture@db.example/app" });
  mocks.pool.mockImplementation(function Pool() { return { query: vi.fn<() => Promise<unknown>>() }; });
  mocks.adapter.mockImplementation(function PrismaPg() { return {}; });
  mocks.client.mockImplementation(clientReturning({ $queryRawUnsafe: vi.fn<(query: string) => Promise<unknown>>() }));
});

afterEach(() => vi.unstubAllEnvs());

describe("getDb", () => {
  it("does nothing on import and initializes one attached pool on first use", async () => {
    vi.stubEnv("DATABASE_URL", undefined);
    const { getDb } = await import("@/db");
    expect(mocks.env).not.toHaveBeenCalled();
    expect(mocks.pool).not.toHaveBeenCalled();
    expect(mocks.attach).not.toHaveBeenCalled();
    expect(mocks.client).not.toHaveBeenCalled();

    const first = getDb();
    expect(getDb()).toBe(first);
    expect(mocks.env).toHaveBeenCalledTimes(1);
    expect(mocks.pool).toHaveBeenCalledExactlyOnceWith({
      connectionString: "postgres://runtime:fixture@db.example/app", max: 5, idleTimeoutMillis: 5000,
    });
    const pool = mocks.pool.mock.results[0].value;
    expect(mocks.attach).toHaveBeenCalledExactlyOnceWith(pool);
    expect(mocks.adapter).toHaveBeenCalledExactlyOnceWith(pool);
    expect(mocks.client).toHaveBeenCalledExactlyOnceWith({ adapter: mocks.adapter.mock.results[0].value });
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
    const query = vi.fn<(query: string) => Promise<unknown>>().mockRejectedValue(failure);
    mocks.client.mockImplementation(clientReturning({ $queryRawUnsafe: query }));
    await expect(getDb().$queryRawUnsafe("fixture")).rejects.toBe(failure);
  });

  it("reuses one client across module reloads outside production", async () => {
    const first = (await import("@/db")).getDb();
    vi.resetModules();
    const second = (await import("@/db")).getDb();
    expect(second).toBe(first);
    expect(mocks.pool).toHaveBeenCalledTimes(1);
  });

  it("keeps the client module-scoped in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { getDb } = await import("@/db");
    expect(getDb()).toBe(getDb());
    expect(globalForDb.portfolioDb).toBeUndefined();
  });
});
