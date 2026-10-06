import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";
import { databaseToolDatasource, isLiveDatabaseCommand } from "./src/lib/validation/database-tooling";

const live = isLiveDatabaseCommand(process.argv.slice(2));

// Offline generation does not load private environment files or need a real URL.
if (live) loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export default defineConfig({
  schema: "prisma",
  migrations: { path: "prisma/migrations" },
  datasource: databaseToolDatasource(live, process.env.DATABASE_URL_UNPOOLED),
});
