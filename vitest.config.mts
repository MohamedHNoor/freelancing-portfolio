import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    /* Pure logic only. No jsdom: components and layout are verified in a real
       browser instead, per the browser verification rule in the standards. */
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    /* Needs a database: `npm run test:integration`. */
    exclude: ["tests/integration/**", "node_modules/**"],
    /* Processed by Vite so tests can stub the `next/headers` it imports, and
       exercise the real SDK against a stubbed upstream. */
    server: { deps: { inline: ["@neondatabase/auth"] } },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
