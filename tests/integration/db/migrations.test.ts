import { describe, expect, it } from "vitest";
import { getDb } from "@/db";
import { OWNER_A, OWNER_B } from "../support/database";

describe("committed migrations", () => {
  it("create the application tables beside the neon_auth stub", async () => {
    const tables = await getDb().$queryRaw<{ table_schema: string; table_name: string }[]>`
      SELECT table_schema, table_name FROM information_schema.tables
      WHERE table_schema IN ('public', 'neon_auth') ORDER BY table_schema, table_name`;

    expect(tables).toEqual([
      { table_schema: "neon_auth", table_name: "user" },
      { table_schema: "public", table_name: "activities" },
      { table_schema: "public", table_name: "clients" },
    ]);
  });

  it("seed both owners", async () => {
    const owners = await getDb().neonAuthUser.findMany({ orderBy: { id: "asc" } });
    expect(owners.map(({ id }) => id)).toEqual([OWNER_A, OWNER_B]);
  });
});
