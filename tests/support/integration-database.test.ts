import { describe, expect, it } from "vitest";
import { assertSafeTestDatabaseUrl, UnsafeTestDatabaseError } from "../integration/support/database";

/* The integration harness rebuilds the database it is pointed at, so this guard
   runs in the default suite, where it needs no database. */
describe("assertSafeTestDatabaseUrl", () => {
  it.each([
    "postgresql://localhost:5432/portfolio_test",
    "postgres://localhost/portfolio_test",
    "postgresql://127.0.0.1:5432/portfolio_test",
    "postgresql://[::1]:5432/portfolio_test",
    "postgresql://mohamed:secret@localhost/portfolio_feature_test",
  ])("accepts %s", (url) => {
    expect(assertSafeTestDatabaseUrl(url)).toBe(url);
  });

  it.each([
    "postgresql://db.remote.example:5432/portfolio_test",
    "postgresql://localhost:5432/portfolio_test?host=db.remote.example",
    "postgresql://localhost:5432/portfolio_test?hostaddr=10.0.0.1",
    "postgresql://localhost:5432/portfolio_test?port=6543",
    "postgresql://localhost:5432/portfolio_test?sslmode=require",
    "postgresql://localhost:5432/my_website_test",
    "postgresql://localhost:5432/portfolio",
    "postgresql://localhost:5432/portfolio_dev",
  ])("refuses %s without echoing it", (url) => {
    let thrown: unknown;
    try {
      assertSafeTestDatabaseUrl(url);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(UnsafeTestDatabaseError);
    const message = (thrown as Error).message;
    expect(message).toContain("TEST_DATABASE_URL");
    expect(message).not.toContain(new URL(url).host);
    expect(message).not.toContain(url);
  });
});
