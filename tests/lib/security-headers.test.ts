import { describe, expect, it } from "vitest";
import {
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
} from "@/lib/security-headers";

/** The policy split back into `name -> value` for assertion. */
function directives(): Map<string, string> {
  return new Map(
    CONTENT_SECURITY_POLICY.split(";").map((part) => {
      const [name, ...rest] = part.trim().split(/\s+/);
      return [name, rest.join(" ")];
    }),
  );
}

describe("SECURITY_HEADERS", () => {
  const names = SECURITY_HEADERS.map((header) => header.key);

  it.each([
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "X-Frame-Options",
    "Permissions-Policy",
  ])("serves %s", (name) => {
    expect(names).toContain(name);
  });

  it("names each header once", () => {
    expect(new Set(names).size).toBe(names.length);
  });

  it("gives every header a non-empty value", () => {
    for (const header of SECURITY_HEADERS) {
      expect(header.value.trim()).not.toBe("");
    }
  });

  it("sets HSTS for two years, including subdomains", () => {
    const hsts = SECURITY_HEADERS.find(
      (h) => h.key === "Strict-Transport-Security",
    );
    expect(hsts?.value).toContain("max-age=63072000");
    expect(hsts?.value).toContain("includeSubDomains");
  });
});

describe("CONTENT_SECURITY_POLICY", () => {
  const parsed = directives();

  it("parses into directives with no empty value", () => {
    expect(parsed.size).toBeGreaterThan(5);
    for (const [name, value] of parsed) {
      expect(name).not.toBe("");
      /* `upgrade-insecure-requests` is a valueless directive by definition. */
      if (name !== "upgrade-insecure-requests") {
        expect(value, `${name} has no value`).not.toBe("");
      }
    }
  });

  it("defaults to self", () => {
    expect(parsed.get("default-src")).toBe("'self'");
  });

  it.each([
    ["frame-ancestors", "'none'"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["connect-src", "'self'"],
    ["font-src", "'self'"],
  ])("locks %s to %s", (name, value) => {
    expect(parsed.get(name)).toBe(value);
  });

  it("upgrades insecure requests", () => {
    expect(parsed.has("upgrade-insecure-requests")).toBe(true);
  });

  /* These two are the deliberate compromise, asserted so that removing them is
     a decision someone makes on purpose and so that they cannot spread to a
     directive that has no reason to carry them. See the comment in
     `src/lib/security-headers.ts` for why a nonce is not an option here. */
  it("allows inline script and style, and only those two", () => {
    expect(parsed.get("script-src")).toBe("'self' 'unsafe-inline'");
    expect(parsed.get("style-src")).toBe("'self' 'unsafe-inline'");

    const others = [...parsed].filter(
      ([name]) => name !== "script-src" && name !== "style-src",
    );
    for (const [name, value] of others) {
      expect(value, `${name} should not allow inline`).not.toContain(
        "unsafe-inline",
      );
    }
  });

  it("allows no eval anywhere", () => {
    expect(CONTENT_SECURITY_POLICY).not.toContain("unsafe-eval");
  });
});
