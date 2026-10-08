import { afterAll, beforeEach } from "vitest";
import { testDatabaseUrl } from "./database";

// getDb() reads DATABASE_URL lazily, so this must run before any query.
process.env.DATABASE_URL = testDatabaseUrl();

const { getDb } = await import("@/db");

beforeEach(async () => {
  await getDb().$executeRaw`TRUNCATE activities, clients`;
});

afterAll(async () => {
  await getDb().$disconnect();
});
