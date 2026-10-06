import "server-only";
import {
  parseAuthBaseUrl,
  parseCookieSecret,
  parseOwnerEmail,
} from "@/lib/validation/auth-env";
import { parseDatabaseUrl } from "@/lib/validation/database-env";

export function getDatabaseEnv() {
  return { databaseUrl: parseDatabaseUrl(process.env.DATABASE_URL, "DATABASE_URL") };
}

export function getAuthEnv() {
  return {
    baseUrl: parseAuthBaseUrl(process.env.NEON_AUTH_BASE_URL),
    cookieSecret: parseCookieSecret(process.env.NEON_AUTH_COOKIE_SECRET),
    ownerEmail: parseOwnerEmail(process.env.OWNER_EMAIL),
  };
}
