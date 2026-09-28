import { describe, expect, it } from "vitest";
import {
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
  contentSecurityPolicy,
  securityHeaders,
} from "@/lib/security-headers";

/** A policy split back into `name -> value` for assertion. */
function directives(policy = CONTENT_SECURITY_POLICY): Map<string, string> {
  return new Map(
    policy.split(";").map((part) => {
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

  it("is the policy the production headers serve", () => {
    expect(contentSecurityPolicy({ development: false })).toBe(
      CONTENT_SECURITY_POLICY,
    );
    const served = SECURITY_HEADERS.find(
      (h) => h.key === "Content-Security-Policy",
    );
    expect(served?.value).toBe(CONTENT_SECURITY_POLICY);
  });
});

/* `next dev` only. React's development build calls `eval()` to rebuild server
   error stacks, and refusing it floods the console. The allowance must not leak
   into production or spread past script-src. */
describe("contentSecurityPolicy in development", () => {
  const development = directives(contentSecurityPolicy({ development: true }));

  it("allows eval in script-src", () => {
    expect(development.get("script-src")).toBe(
      "'self' 'unsafe-inline' 'unsafe-eval'",
    );
  });

  it("allows eval nowhere else", () => {
    for (const [name, value] of development) {
      if (name !== "script-src") {
        expect(value, `${name} should not allow eval`).not.toContain(
          "unsafe-eval",
        );
      }
    }
  });

  it("matches production in every other directive", () => {
    const production = directives();
    expect([...development.keys()]).toEqual([...production.keys()]);
    for (const [name, value] of production) {
      if (name !== "script-src") {
        expect(development.get(name), name).toBe(value);
      }
    }
  });

  it("is what the development headers serve", () => {
    const served = securityHeaders({ development: true }).find(
      (h) => h.key === "Content-Security-Policy",
    );
    expect(served?.value).toBe(contentSecurityPolicy({ development: true }));
  });
});
