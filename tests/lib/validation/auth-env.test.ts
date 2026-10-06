import { describe, expect, it } from "vitest";
import {
  AuthConfigurationError,
  parseAuthBaseUrl,
  parseCookieSecret,
  parseOwnerEmail,
} from "@/lib/validation/auth-env";

const BASE = "https://ep-fixture.neonauth.ap-southeast-2.aws.neon.tech/neondb/auth";

describe("parseAuthBaseUrl", () => {
  it("keeps a valid https Auth URL and its path exactly", () => {
    expect(parseAuthBaseUrl(`  ${BASE}  `)).toBe(BASE);
  });

  it.each([
    undefined, null, 42, "", "   ", "not a url", `http://${BASE.slice(8)}`,
    "https://user:pass@ep.neon.tech/neondb/auth", `${BASE}?x=1`, `${BASE}#frag`,
    `${BASE}?`, "https:///neondb/auth", `${BASE} extra`,
  ])("fails closed for %s", (value) => {
    expect(() => parseAuthBaseUrl(value)).toThrow(AuthConfigurationError);
  });
});

describe("parseCookieSecret", () => {
  it("accepts 32 or more characters and returns the value unchanged", () => {
    const secret = "s".repeat(32);
    expect(parseCookieSecret(secret)).toBe(secret);
  });

  it.each([undefined, "", "short", " ".repeat(40), `${" ".repeat(10)}${"s".repeat(31)}`])(
    "rejects %j",
    (value) => {
      expect(() => parseCookieSecret(value)).toThrow("NEON_AUTH_COOKIE_SECRET must be");
    },
  );
});

describe("parseOwnerEmail", () => {
  it("trims and lowercases", () => {
    expect(parseOwnerEmail("  Owner@Example.COM ")).toBe("owner@example.com");
  });

  it.each([undefined, "", "not-an-email", `${"a".repeat(250)}@x.io`])("rejects %j", (value) => {
    expect(() => parseOwnerEmail(value)).toThrow("OWNER_EMAIL must be");
  });
});

describe("redaction", () => {
  it.each([
    [() => parseAuthBaseUrl("https://user:private-password@ep.neon.tech/x?token=private-token"), "NEON_AUTH_BASE_URL"],
    [() => parseCookieSecret("private-short"), "NEON_AUTH_COOKIE_SECRET"],
    [() => parseOwnerEmail("private-value"), "OWNER_EMAIL"],
  ])("names only the variable, never the value", (run, variable) => {
    try {
      run();
      expect.fail("Expected a configuration error");
    } catch (error) {
      expect(error).toBeInstanceOf(AuthConfigurationError);
      expect(String(error)).toContain(variable);
      expect(String(error)).not.toMatch(/private/);
      expect(error).not.toHaveProperty("cause");
    }
  });
});
