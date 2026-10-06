import { parseDatabaseUrl } from "./database-env";

/** `.invalid` never resolves (RFC 2606), so an offline command cannot reach a database. */
export const OFFLINE_DATABASE_URL = "postgresql://offline.invalid/offline";

const LIVE_MIGRATE_SUBCOMMANDS: ReadonlySet<string> = new Set(["deploy", "status", "resolve"]);

/** Only the documented live tools load private env files and receive the direct URL:
 *  applying migrations, checking and recovering their state, and Studio. */
export function isLiveDatabaseCommand(args: readonly string[]): boolean {
  const [command, subcommand] = args;
  return (
    command === "studio" ||
    (command === "migrate" && subcommand !== undefined && LIVE_MIGRATE_SUBCOMMANDS.has(subcommand))
  );
}

/**
 * Prisma 7's schema engine needs a URL even for `migrate diff --from-empty`, so
 * offline tools get the unroutable placeholder; live tools require the direct URL.
 */
export function databaseToolDatasource(live: boolean, directUrl: unknown) {
  return { url: live ? parseDatabaseUrl(directUrl, "DATABASE_URL_UNPOOLED") : OFFLINE_DATABASE_URL };
}
