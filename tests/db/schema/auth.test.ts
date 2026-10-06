import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { account, rateLimit, session, user, verification } from "@/db/schema";

describe("auth schema storage contract", () => {
  it.each([user, session, account, verification, rateLimit])("uses text primary identifiers", (table) => {
    expect(table.id.getSQLType()).toBe("text");
    expect(table.id.primary).toBe(true);
  });

  it("enforces unique email, session token and rate key", () => {
    expect(user.email.isUnique).toBe(true);
    expect(session.token.isUnique).toBe(true);
    expect(rateLimit.key.isUnique).toBe(true);
    expect(rateLimit.count.getSQLType()).toBe("integer");
    expect(rateLimit.lastRequest.getSQLType()).toBe("bigint");
  });

  it.each([session, account])("cascades the user foreign key with a non-null owner", (table) => {
    const [fk] = getTableConfig(table).foreignKeys;
    expect(fk.onDelete).toBe("cascade");
    expect(fk.reference().foreignTable).toBe(user);
    expect(table.userId.notNull).toBe(true);
  });

  it.each([user, session, account, verification])("keeps lifecycle timestamps timezone-aware with insert/update defaults", (table) => {
    expect(table.createdAt.getSQLType()).toBe("timestamp with time zone");
    expect(table.updatedAt.getSQLType()).toBe("timestamp with time zone");
    expect(table.createdAt.notNull).toBe(true);
    expect(table.updatedAt.notNull).toBe(true);
    expect(table.createdAt.default).toBeDefined();
    expect(table.updatedAt.default).toBeDefined();
    expect(table.updatedAt.onUpdateFn).toBeDefined();
    for (const column of getTableConfig(table).columns) {
      if (column.dataType === "date") expect(column.getSQLType()).toBe("timestamp with time zone");
    }
  });
});
