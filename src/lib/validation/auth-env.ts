import { z } from "zod";

export type AuthEnvVariable =
  | "NEON_AUTH_BASE_URL"
  | "NEON_AUTH_COOKIE_SECRET"
  | "OWNER_EMAIL";

const REQUIREMENTS: Record<AuthEnvVariable, string> = {
  NEON_AUTH_BASE_URL: "must be the branch's https Auth URL",
  NEON_AUTH_COOKIE_SECRET: "must be at least 32 characters",
  OWNER_EMAIL: "must be the owner's email address",
};

export class AuthConfigurationError extends Error {
  constructor(variable: AuthEnvVariable) {
    super(`${variable} ${REQUIREMENTS[variable]}.`);
    this.name = "AuthConfigurationError";
  }
}

/** Neon's Auth URL carries a path (`/neondb/auth`), so the path is kept exactly. */
export function parseAuthBaseUrl(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "" || /\s/.test(value.trim())) {
    throw new AuthConfigurationError("NEON_AUTH_BASE_URL");
  }
  const trimmed = value.trim();
  // The URL parser would read `https:///x` as host `x`; require a host first.
  if (!/^https:\/\/[^/]/i.test(trimmed)) throw new AuthConfigurationError("NEON_AUTH_BASE_URL");
  try {
    const url = new URL(trimmed);
    if (
      url.protocol === "https:" &&
      url.hostname.length > 0 &&
      url.username === "" &&
      url.password === "" &&
      url.search === "" &&
      url.hash === "" &&
      !trimmed.includes("?") &&
      !trimmed.includes("#")
    ) {
      return trimmed;
    }
  } catch {
    // Reported below without the value.
  }
  throw new AuthConfigurationError("NEON_AUTH_BASE_URL");
}

export function parseCookieSecret(value: unknown): string {
  if (typeof value !== "string" || value.trim().length < 32) {
    throw new AuthConfigurationError("NEON_AUTH_COOKIE_SECRET");
  }
  return value;
}

const ownerEmailSchema = z.string().trim().toLowerCase().max(254).email();

export function parseOwnerEmail(value: unknown): string {
  const result = ownerEmailSchema.safeParse(value);
  if (!result.success) throw new AuthConfigurationError("OWNER_EMAIL");
  return result.data;
}
