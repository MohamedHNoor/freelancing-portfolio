import { describe, expect, it } from "vitest";
import {
  OFFLINE_DATABASE_URL,
  databaseToolDatasource,
  isShadowDiffCommand,
  parseShadowDatabaseUrl,
  shadowDiffDatasource,
  isLiveDatabaseCommand,
} from "@/lib/validation/database-tooling";

describe("isLiveDatabaseCommand", () => {
  it.each([
    ["migrate", "deploy"],
    ["migrate", "status"],
    ["migrate", "resolve", "--rolled-back", "20261007000000_init"],
    ["studio"],
    ["studio", "--port", "5555"],
  ])("treats %j as live", (...args) => {
    expect(isLiveDatabaseCommand(args)).toBe(true);
  });

  it.each([[], ["generate"], ["validate"], ["format"], ["migrate"], ["migrate", "diff", "--from-empty"], ["migrate", "dev"], ["db", "push"], ["migrate", "reset"]])(
    "keeps %j offline",
    (...args) => {
      expect(isLiveDatabaseCommand(args)).toBe(false);
    },
  );
});

describe("databaseToolDatasource", () => {
  it("gives offline tools an unroutable placeholder, even if a private value is supplied", () => {
    expect(databaseToolDatasource(false, undefined)).toEqual({ url: OFFLINE_DATABASE_URL });
    expect(databaseToolDatasource(false, "postgres://owner:fixture@db.example/app")).toEqual({ url: OFFLINE_DATABASE_URL });
    expect(new URL(OFFLINE_DATABASE_URL).hostname.endsWith(".invalid")).toBe(true);
  });

  it("requires a valid direct URL for live tools", () => {
    expect(() => databaseToolDatasource(true, undefined)).toThrow("DATABASE_URL_UNPOOLED must be");
    expect(() => databaseToolDatasource(true, "postgres://owner:fixture@db.example/")).toThrow("DATABASE_URL_UNPOOLED must be");
    const url = "postgres://owner:fixture@db.example/app?sslmode=require";
    expect(databaseToolDatasource(true, url)).toEqual({ url });
  });
});

describe("isShadowDiffCommand", () => {
  it("recognises a diff from the committed migrations", () => {
    expect(isShadowDiffCommand(["migrate", "diff", "--from-migrations", "prisma/migrations", "--to-schema", "prisma"])).toBe(true);
  });

  it.each([[], ["migrate", "diff", "--from-empty"], ["migrate", "deploy"], ["generate"], ["diff", "--from-migrations"]])(
    "ignores %j",
    (...args) => {
      expect(isShadowDiffCommand(args)).toBe(false);
    },
  );
});

describe("shadowDiffDatasource", () => {
  it("pairs the unroutable placeholder with a local shadow database", () => {
    const shadow = "postgresql://localhost:5432/portfolio_shadow";
    expect(shadowDiffDatasource(shadow)).toEqual({ url: OFFLINE_DATABASE_URL, shadowDatabaseUrl: shadow });
    expect(parseShadowDatabaseUrl("postgres://me@127.0.0.1/portfolio_diff_shadow")).toBe("postgres://me@127.0.0.1/portfolio_diff_shadow");
  });

  it.each([
    undefined,
    "",
    "not a url",
    "postgresql://db.example.neon.tech/portfolio_shadow",
    "postgresql://localhost:5432/portfolio_test",
    "postgresql://localhost:5432/neondb",
    "postgresql://localhost:5432/portfolio_shadow?host=db.example.neon.tech",
    "mysql://localhost/portfolio_shadow",
  ])("refuses %j", (value) => {
    expect(() => shadowDiffDatasource(value)).toThrow("SHADOW_DATABASE_URL must be");
  });
});
