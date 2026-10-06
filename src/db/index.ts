import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseEnv } from "@/lib/env";

function createDatabase() {
  const { databaseUrl } = getDatabaseEnv();
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 5000,
  });
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

/* Next's dev server re-evaluates modules on hot reload, which would build a new
   client and pool each time. Outside production the instance also lives on
   `globalThis`, as Prisma's Next.js guidance recommends. */
const globalForDb = globalThis as unknown as { portfolioDb?: PrismaClient };

let database: PrismaClient | undefined;

export function getDb() {
  database ??= globalForDb.portfolioDb ?? createDatabase();
  if (process.env.NODE_ENV !== "production") globalForDb.portfolioDb = database;
  return database;
}
