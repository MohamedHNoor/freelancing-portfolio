import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { expect, it } from "vitest";

// getDb() relies on PrismaPg recognising its pool (`instanceof pg.Pool`), or the
// adapter silently builds its own pool that attachDatabasePool never sees.
it("drives the attached pool it is given rather than creating its own", async () => {
  const pool = new Pool({ connectionString: "postgres://fixture@db.invalid/app" }); // lazy: never connects
  const adapter = await new PrismaPg(pool).connect();
  try {
    expect(adapter.underlyingDriver()).toBe(pool);
  } finally {
    await adapter.dispose();
    await pool.end();
  }
});
