import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/* Services and ownership checks against a real local Postgres database. The
   setup refuses any TEST_DATABASE_URL that is not a local portfolio `_test`
   database, because every run rebuilds it from the committed migrations. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    fileParallelism: false,
    globalSetup: ["tests/integration/support/global-setup.ts"],
    setupFiles: ["tests/integration/support/setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/integration/support/server-only.ts", import.meta.url)),
    },
  },
});
