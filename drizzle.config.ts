import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { databaseToolCredentials } from "./src/lib/validation/database-tooling";

const command = process.argv[2];
if (command !== "generate" && command !== "migrate" && command !== "studio") {
  throw new Error("Use a documented db:generate, db:migrate or db:studio command.");
}

// Offline generation does not load private environment files or need a URL.
if (command !== "generate") loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./drizzle",
  casing: "snake_case",
  strict: true,
  verbose: true,
  ...databaseToolCredentials(command, process.env.DATABASE_URL_UNPOOLED),
});
