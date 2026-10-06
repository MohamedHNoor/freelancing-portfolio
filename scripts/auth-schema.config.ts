import type { BetterAuthOptions } from "better-auth";

/** CLI-only options; no auth instance, database, environment reads or endpoints. */
export const auth = {
  options: {
    rateLimit: { enabled: true, storage: "database" },
    telemetry: { enabled: false },
  } satisfies BetterAuthOptions,
};
