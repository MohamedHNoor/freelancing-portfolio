import { parseDatabaseUrl } from "./database-env";

export type DatabaseToolCommand = "generate" | "migrate" | "studio";

/** Offline generation never receives credentials; live tools require the direct URL. */
export function databaseToolCredentials(command: DatabaseToolCommand, directUrl: unknown) {
  if (command === "generate") return {};
  return {
    dbCredentials: { url: parseDatabaseUrl(directUrl, "DATABASE_URL_UNPOOLED") },
  };
}
