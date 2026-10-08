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

/** `migrate diff --from-migrations` replays the committed migrations into a shadow database. */
export function isShadowDiffCommand(args: readonly string[]): boolean {
  const [command, subcommand, ...rest] = args;
  return command === "migrate" && subcommand === "diff" && rest.includes("--from-migrations");
}

const LOCAL_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const SHADOW_DATABASE_NAME = /^portfolio[a-z0-9_]*_shadow$/;

/**
 * Prisma drops and rebuilds the shadow database on every diff, so only a local,
 * portfolio-specific `_shadow` database with no query string is accepted. Query
 * parameters such as `host` could otherwise redirect the connection elsewhere.
 */
export function parseShadowDatabaseUrl(value: unknown): string {
  const message =
    'SHADOW_DATABASE_URL must be a local PostgreSQL URL (localhost) for a database whose name starts with "portfolio" and ends in "_shadow", with no query string. It is rebuilt on every diff.';
  if (typeof value !== "string" || value.trim() === "") throw new Error(message);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(message);
  }
  const name = decodeURIComponent(url.pathname.slice(1));
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    url.search !== "" ||
    !LOCAL_HOSTS.has(url.hostname) ||
    !SHADOW_DATABASE_NAME.test(name)
  ) {
    throw new Error(message);
  }
  return value;
}

/** A diff against the committed migrations reads no real database: only the shadow. */
export function shadowDiffDatasource(shadowUrl: unknown) {
  return { url: OFFLINE_DATABASE_URL, shadowDatabaseUrl: parseShadowDatabaseUrl(shadowUrl) };
}

/**
 * Prisma 7's schema engine needs a URL even for `migrate diff --from-empty`, so
 * offline tools get the unroutable placeholder; live tools require the direct URL.
 */
export function databaseToolDatasource(live: boolean, directUrl: unknown) {
  return { url: live ? parseDatabaseUrl(directUrl, "DATABASE_URL_UNPOOLED") : OFFLINE_DATABASE_URL };
}
