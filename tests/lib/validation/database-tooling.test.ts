import { describe, expect, it } from "vitest";
import { databaseToolCredentials } from "@/lib/validation/database-tooling";

describe("databaseToolCredentials", () => {
  it("generates offline without credentials, even if a private value is supplied", () => {
    expect(databaseToolCredentials("generate", undefined)).toEqual({});
    expect(databaseToolCredentials("generate", "not-a-url")).toEqual({});
  });

  it.each(["migrate", "studio"] as const)("requires a direct URL for %s", (command) => {
    expect(() => databaseToolCredentials(command, undefined)).toThrow("DATABASE_URL_UNPOOLED must be");
    expect(() => databaseToolCredentials(command, "postgres://owner:fixture@db.example/")).toThrow("DATABASE_URL_UNPOOLED must be");
    const url = "postgres://owner:fixture@db.example/app?sslmode=require";
    expect(databaseToolCredentials(command, url)).toEqual({ dbCredentials: { url } });
  });
});
