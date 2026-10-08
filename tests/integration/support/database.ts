import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { Client } from "pg";
import { parseDatabaseUrl } from "@/lib/validation/database-env";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const TEST_DATABASE_NAME = /^portfolio[a-z0-9_]*_test$/;

/** The two owners every integration test can act as. */
export const OWNER_A = "00000000-0000-4000-8000-00000000000a";
export const OWNER_B = "00000000-0000-4000-8000-00000000000b";

export class UnsafeTestDatabaseError extends Error {
  constructor() {
    super(
      "TEST_DATABASE_URL must point at a local database (localhost) whose name starts with \"portfolio\" and ends in \"_test\", with no query string. It is rebuilt on every run.",
    );
    this.name = "UnsafeTestDatabaseError";
  }
}

/**
 * Accepts only a local, portfolio-specific `_test` database with no query
 * string. `pg` lets query parameters such as `host`, `hostaddr` and `port`
 * override the URL's own host, and a local test database needs none of them.
 */
export function assertSafeTestDatabaseUrl(url: string): string {
  const { hostname, pathname, search } = new URL(url);
  const name = decodeURIComponent(pathname.slice(1));
  if (search !== "" || !LOCAL_HOSTS.has(hostname) || !TEST_DATABASE_NAME.test(name)) {
    throw new UnsafeTestDatabaseError();
  }
  return url;
}

/**
 * Loads env files the way prisma.config.ts does, then returns TEST_DATABASE_URL
 * only when it passes `assertSafeTestDatabaseUrl`. Every run drops that
 * database's schemas, so anything else is refused before connecting.
 */
export function testDatabaseUrl(): string {
  loadEnvConfig(process.cwd(), true);
  return assertSafeTestDatabaseUrl(parseDatabaseUrl(process.env.TEST_DATABASE_URL, "TEST_DATABASE_URL"));
}

const MIGRATIONS = join(process.cwd(), "prisma", "migrations");

/** Rebuilds the schema from the committed migrations, as `migrate deploy` would apply them. */
export async function rebuildDatabase(url: string): Promise<void> {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("DROP SCHEMA IF EXISTS public CASCADE");
    await client.query("DROP SCHEMA IF EXISTS neon_auth CASCADE");
    await client.query("CREATE SCHEMA public");
    // Stands in for the table Managed Better Auth creates on each Neon branch.
    await client.query('CREATE SCHEMA neon_auth; CREATE TABLE neon_auth."user" (id uuid PRIMARY KEY)');

    const migrations = readdirSync(MIGRATIONS, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    for (const migration of migrations) {
      await client.query(readFileSync(join(MIGRATIONS, migration, "migration.sql"), "utf8"));
    }

    await client.query('INSERT INTO neon_auth."user" (id) VALUES ($1), ($2)', [OWNER_A, OWNER_B]);
  } finally {
    await client.end();
  }
}
