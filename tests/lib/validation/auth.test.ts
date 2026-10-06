import { describe, expect, it } from "vitest";
import { emailOnlySchema, resetPasswordSchema, signInSchema } from "@/lib/validation/auth";

describe("auth schemas", () => {
  it("normalizes email to trimmed lowercase", () => {
    expect(signInSchema.parse({ email: "  Owner@Example.COM ", password: "x" }).email).toBe("owner@example.com");
    expect(emailOnlySchema.parse({ email: "A@B.io" }).email).toBe("a@b.io");
  });

  it.each([
    [{ email: "", password: "x" }, "email"],
    [{ email: `${"a".repeat(250)}@b.io`, password: "x" }, "email"],
    [{ email: "a@b.io", password: "" }, "password"],
    [{ email: "a@b.io", password: "p".repeat(129) }, "password"],
    [{}, "email"],
  ])("rejects sign-in input %j on %s", (input, field) => {
    const result = signInSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toHaveProperty(field);
  });

  it("enforces token bounds and a 12 to 128 character password", () => {
    expect(resetPasswordSchema.safeParse({ token: "t", password: "p".repeat(12) }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "t", password: "p".repeat(11) }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "t", password: "p".repeat(129) }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "", password: "p".repeat(12) }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "t".repeat(513), password: "p".repeat(12) }).success).toBe(false);
  });
});
