import { describe, expect, it } from "vitest";
import {
  DatabaseConfigurationError,
  parseDatabaseUrl,
} from "@/lib/validation/database-env";

describe("parseDatabaseUrl", () => {
  it.each([
    "postgres://localhost/application",
    "postgresql://owner:p%40ss%2Fword@db.example:5432/app%2Fname?sslmode=require&application_name=dashboard",
  ])("preserves a supported URI and its encoded connection options", (url) => {
    expect(parseDatabaseUrl(`  ${url}  `, "DATABASE_URL")).toBe(url);
  });

  it.each([
    undefined, null, 123, "", "  ", "not-a-url", "https://db.example/app",
    "postgres:///app", "postgres://db.example", "postgres://db.example/",
    "postgres://db.example/app/extra", "postgres://db.example/%GG",
    "postgres://owner:%GG@db.example/app", "postgres://db.example/app#fragment",
    "postgres://db.example/my database", "postgres://db.example/%20",
  ])("fails closed for an invalid URI (%s)", (value) => {
    expect(() => parseDatabaseUrl(value, "DATABASE_URL")).toThrow(DatabaseConfigurationError);
  });

  it.each(["DATABASE_URL", "DATABASE_URL_UNPOOLED", "TEST_DATABASE_URL"] as const)(
    "names only %s in configuration errors",
    (variable) => {
      const secret = "postgres://owner:private-password@db.example/";
      try {
        parseDatabaseUrl(secret, variable);
        expect.fail("Expected invalid configuration");
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseConfigurationError);
        expect(String(error)).toContain(variable);
        expect(String(error)).not.toContain(secret);
        expect(String(error)).not.toContain("private-password");
        expect(error).not.toHaveProperty("cause");
      }
    },
  );
});
