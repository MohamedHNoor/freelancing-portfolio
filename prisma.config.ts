import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";
import { databaseToolDatasource, isLiveDatabaseCommand } from "./src/lib/validation/database-tooling";

const live = isLiveDatabaseCommand(process.argv.slice(2));

// Offline generation does not load private environment files or need a real URL.
if (live) loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export default defineConfig({
  schema: "prisma",
  // Managed Better Auth owns neon_auth.user; Prisma reads it and references it, never migrates it.
  experimental: { externalTables: true },
  tables: { external: ["neon_auth.user"] },
  migrations: {
    path: "prisma/migrations",
    // A fresh shadow database has no neon_auth schema, so replayed foreign keys need this stub.
    initShadowDb: `
      CREATE SCHEMA IF NOT EXISTS neon_auth;
      CREATE TABLE IF NOT EXISTS neon_auth."user" (id uuid PRIMARY KEY);
    `,
  },
  datasource: databaseToolDatasource(live, process.env.DATABASE_URL_UNPOOLED),
});
