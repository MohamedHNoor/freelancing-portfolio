import "server-only";
import { parseDatabaseUrl } from "@/lib/validation/database-env";

export function getDatabaseEnv() {
  return { databaseUrl: parseDatabaseUrl(process.env.DATABASE_URL, "DATABASE_URL") };
}
