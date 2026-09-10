import { describe, expect, it } from "vitest";
import {
  DEVELOPMENT_SITE_URL,
  absoluteUrl,
  joinSiteUrl,
  resolveSiteUrl,
} from "@/lib/site";

const PRODUCTION = { requireConfigured: true } as const;
const DEVELOPMENT = { requireConfigured: false } as const;

describe("resolveSiteUrl", () => {
  it("accepts a plain https origin", () => {
    expect(resolveSiteUrl("https://example.com", PRODUCTION)).toBe(
      "https://example.com",
    );
  });

  it("accepts an origin with a port", () => {
    expect(resolveSiteUrl("http://localhost:3000", PRODUCTION)).toBe(
      "http://localhost:3000",
    );
  });

  it("drops a trailing slash", () => {
    expect(resolveSiteUrl("https://example.com/", PRODUCTION)).toBe(
      "https://example.com",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(resolveSiteUrl("  https://example.com  ", PRODUCTION)).toBe(
      "https://example.com",
    );
  });

  /* Every rejected shape is checked in both modes, because the two branches are
     the whole point of the function: a production build must stop, and a
     development run must keep working without an env file. */
  const rejected: readonly (readonly [string | undefined, string])[] = [
    [undefined, "nothing set"],
    ["", "an empty value"],
    ["   ", "only whitespace"],
    ["ftp://example.com", "a scheme that is not http or https"],
    ["example.com", "no scheme at all"],
    ["https://example.com/en", "a path"],
    ["https://example.com/?ref=x", "a query string"],
    ["https://example.com/#top", "a fragment"],
  ];

  it.each(rejected)("throws for %o in a production build (%s)", (raw) => {
    expect(() => resolveSiteUrl(raw, PRODUCTION)).toThrow(
      /NEXT_PUBLIC_SITE_URL/,
    );
  });

  it.each(rejected)("falls back for %o outside production (%s)", (raw) => {
    expect(resolveSiteUrl(raw, DEVELOPMENT)).toBe(DEVELOPMENT_SITE_URL);
  });
});

describe("joinSiteUrl", () => {
  it("appends a route path", () => {
    expect(joinSiteUrl("https://example.com", "/about")).toBe(
      "https://example.com/about",
    );
  });

  it("returns the bare origin for the site root", () => {
    expect(joinSiteUrl("https://example.com", "/")).toBe("https://example.com");
    expect(joinSiteUrl("https://example.com", "")).toBe("https://example.com");
  });

  it("never doubles the slash when the origin carries one", () => {
    expect(joinSiteUrl("https://example.com/", "/about")).toBe(
      "https://example.com/about",
    );
    expect(joinSiteUrl("https://example.com/", "/")).toBe("https://example.com");
  });

  it("adds the missing slash on a bare path", () => {
    expect(joinSiteUrl("https://example.com", "about")).toBe(
      "https://example.com/about",
    );
  });
});

describe("absoluteUrl", () => {
  /* Vitest does not run as a production build, so the configured origin resolves
     to the development fallback here regardless of any local `.env`. */
  it("resolves against this build's origin", () => {
    expect(absoluteUrl("/sitemap.xml")).toBe(
      `${DEVELOPMENT_SITE_URL}/sitemap.xml`,
    );
    expect(absoluteUrl("/")).toBe(DEVELOPMENT_SITE_URL);
  });
});
