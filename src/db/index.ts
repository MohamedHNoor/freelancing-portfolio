import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getDatabaseEnv } from "@/lib/env";
import * as schema from "@/db/schema";

function createDatabase() {
  const { databaseUrl } = getDatabaseEnv();
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 5000,
  });
  attachDatabasePool(pool);
  return drizzle({ client: pool, schema, casing: "snake_case" });
}

let database: ReturnType<typeof createDatabase> | undefined;

export function getDb() {
  return database ??= createDatabase();
}
