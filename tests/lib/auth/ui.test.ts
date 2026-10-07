import { describe, expect, it } from "vitest";
import { PASSWORD_SAVED_NOTICE, knownFieldErrors, loginNotice, parseResetToken, resetTokenFromQuery } from "@/lib/auth/ui";

describe("parseResetToken", () => {
  it.each([undefined, null, "", [], ["first", "second"], ["single"], 1, {}, "t".repeat(513)])(
    "rejects missing, repeated, non-string and oversized tokens",
    (value) => expect(parseResetToken(value)).toBeNull(),
  );

  it("accepts the inclusive length limits and preserves the opaque value", () => {
    expect(parseResetToken("t")).toBe("t");
    expect(parseResetToken("t".repeat(512))).toBe("t".repeat(512));
    expect(parseResetToken(" unchanged opaque token ")).toBe(" unchanged opaque token ");
  });
});

describe("resetTokenFromQuery", () => {
  it("blocks a provider-rejected token even when one is also supplied", () => {
    expect(resetTokenFromQuery({ token: "opaque", error: "INVALID_TOKEN" })).toBeNull();
  });

  it("never turns callback text into a token or verification authority", () => {
    expect(resetTokenFromQuery({ error: "untrusted callback text" })).toBeNull();
    expect(resetTokenFromQuery({ token: ["first", "second"], error: "unknown" })).toBeNull();
    expect(resetTokenFromQuery({ token: "opaque", error: "unknown" })).toBe("opaque");
  });
});

describe("knownFieldErrors", () => {
  const fields = ["email", "password"] as const;

  it("takes the first message for known fields in focus order", () => {
    expect(knownFieldErrors({ password: ["Choose a password.", "Unused."], email: ["Check your email."] }, fields))
      .toEqual([{ field: "email", message: "Check your email." }, { field: "password", message: "Choose a password." }]);
  });

  it("ignores unknown fields and missing or empty messages", () => {
    expect(knownFieldErrors({ token: ["Private token problem."], root: ["Other."], email: [], password: [""] }, fields)).toEqual([]);
    expect(knownFieldErrors(undefined, fields)).toEqual([]);
  });

  it("does not map inherited field messages", () => {
    const errors: Record<string, string[]> = Object.create({ email: ["Inherited."] });
    expect(knownFieldErrors(errors, fields)).toEqual([]);
  });
});

describe("loginNotice", () => {
  it("shows the fixed notice only for the exact reset flag", () => {
    expect(loginNotice({ reset: "done" })).toBe(PASSWORD_SAVED_NOTICE);
  });

  it.each([{}, { reset: "" }, { reset: "DONE" }, { reset: ["done"] }, { reset: ["done", "done"] }, { reset: "<b>done</b>" }])(
    "shows nothing for %j",
    (query) => expect(loginNotice(query)).toBeNull(),
  );
});
