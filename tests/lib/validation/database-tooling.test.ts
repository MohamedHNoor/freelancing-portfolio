import { describe, expect, it } from "vitest";
import {
  OFFLINE_DATABASE_URL,
  databaseToolDatasource,
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
