import { z } from "zod";

export type DatabaseUrlVariable =
  | "DATABASE_URL"
  | "DATABASE_URL_UNPOOLED"
  | "TEST_DATABASE_URL";

const databaseUrlSchema = z.string().trim().min(1).refine((value) => {
  if (/\s/.test(value)) return false;
  try {
    const url = new URL(value);
    const database = decodeURIComponent(url.pathname.slice(1));
    decodeURIComponent(url.username);
    decodeURIComponent(url.password);
    return (
      (url.protocol === "postgres:" || url.protocol === "postgresql:") &&
      url.hostname.length > 0 &&
      database.trim().length > 0 &&
      !url.pathname.slice(1).includes("/") &&
      url.hash === ""
    );
  } catch {
    return false;
  }
});

export class DatabaseConfigurationError extends Error {
  constructor(variable: DatabaseUrlVariable) {
    super(`${variable} must be a PostgreSQL connection URL with a host and database name.`);
    this.name = "DatabaseConfigurationError";
  }
}

/** Validate without normalizing credentials or retaining parser error inputs. */
export function parseDatabaseUrl(value: unknown, variable: DatabaseUrlVariable): string {
  const result = databaseUrlSchema.safeParse(value);
  if (!result.success) throw new DatabaseConfigurationError(variable);
  return result.data;
}
