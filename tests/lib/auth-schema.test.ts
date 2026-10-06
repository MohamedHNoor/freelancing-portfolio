import { describe, expect, it } from "vitest";
import { normalizeAuthSchema } from "@/lib/auth-schema";

const generated = ["user", "session", "account", "verification", "rate_limit"]
  .map((name) => `export const ${name} = pgTable("${name}", {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
    expiresAt: timestamp("expires_at"),
  });`).join("\n");

describe("normalizeAuthSchema", () => {
  it("adds timezone storage and an update timestamp insert default without dropping constraints", () => {
    const schema = normalizeAuthSchema(generated);
    expect(schema).toContain('timestamp("created_at", { withTimezone: true }).defaultNow().notNull()');
    expect(schema).toContain('timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull()');
    expect(schema).toContain('timestamp("expires_at", { withTimezone: true })');
  });

  it("preserves a generator-provided default once", () => {
    const schema = normalizeAuthSchema(generated.replaceAll('timestamp("updated_at")', 'timestamp("updated_at")\n    .defaultNow()'));
    expect(schema).not.toContain(".defaultNow().defaultNow()");
  });

  it("rejects changed table sets and date syntax before writing schema", () => {
    expect(() => normalizeAuthSchema(generated.replace('pgTable("user"', 'pgTable("unexpected"'))).toThrow("unexpected table set");
    expect(() => normalizeAuthSchema(generated.replaceAll(/timestamp\("\w+"\)/g, "timestamp(unsupported)"))).toThrow("unexpected date syntax");
    expect(() => normalizeAuthSchema(generated.replace('timestamp("expires_at")', 'timestamp(unsupported)'))).toThrow("unexpected date syntax");
  });

  it("supports the generator's multiline table declarations", () => {
    expect(() => normalizeAuthSchema(generated.replaceAll('pgTable("', 'pgTable(\n  "'))).not.toThrow();
  });
});
