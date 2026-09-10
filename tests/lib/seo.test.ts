import { describe, expect, it } from "vitest";
import type { NavItem } from "@/lib/site";
import {
  ROUTE_PATHS,
  assertRoutesCoverNavigation,
  buildSitemapEntries,
  routeMetadata,
} from "@/lib/seo";

const ORIGIN = "https://example.com";
const SLUGS = ["first-project", "second-project"] as const;

describe("routeMetadata", () => {
  it("declares the canonical and og:url as the same path", () => {
    const meta = routeMetadata("/about");
    expect(meta.alternates?.canonical).toBe("/about");
    expect(meta.openGraph?.url).toBe("/about");
  });

  it("defaults to the website type", () => {
    expect(routeMetadata("/about").openGraph).toMatchObject({
      type: "website",
    });
  });

  it("carries the article type for a case study", () => {
    expect(
      routeMetadata("/projects/x", { type: "article" }).openGraph,
    ).toMatchObject({ type: "article" });
  });

  /* A page's `openGraph` replaces the layout's object rather than merging into
     it, so anything missing here is missing from the rendered page. */
  it("repeats the site name so a route cannot drop og:site_name", () => {
    expect(routeMetadata("/about").openGraph?.siteName).toBeTruthy();
  });
});

describe("assertRoutesCoverNavigation", () => {
  const nav: readonly NavItem[] = [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  it("passes when every navigation route is listed", () => {
    expect(() =>
      assertRoutesCoverNavigation(["/", "/about", "/contact"], nav),
    ).not.toThrow();
  });

  it("throws naming the item when a navigation route is missing", () => {
    expect(() => assertRoutesCoverNavigation(["/", "/about"], nav)).toThrow(
      /Contact.*\/contact/,
    );
  });

  it("ignores an anchor, which is not a sitemap URL", () => {
    expect(() =>
      assertRoutesCoverNavigation(["/"], [{ label: "Contact", href: "/#contact" }]),
    ).not.toThrow();
  });

  it("holds for the real navigation and the real route list", () => {
    expect(() => assertRoutesCoverNavigation(ROUTE_PATHS)).not.toThrow();
  });
});

describe("buildSitemapEntries", () => {
  it("lists the static routes first, then one URL per project", () => {
    expect(buildSitemapEntries(ORIGIN, ROUTE_PATHS, SLUGS)).toEqual([
      { url: "https://example.com" },
      { url: "https://example.com/about" },
      { url: "https://example.com/services" },
      { url: "https://example.com/projects" },
      { url: "https://example.com/skills" },
      { url: "https://example.com/experience" },
      { url: "https://example.com/resume" },
      { url: "https://example.com/contact" },
      { url: "https://example.com/projects/first-project" },
      { url: "https://example.com/projects/second-project" },
    ]);
  });

  it("emits url only, with no fabricated lastModified or priority", () => {
    for (const entry of buildSitemapEntries(ORIGIN, ROUTE_PATHS, SLUGS)) {
      expect(Object.keys(entry)).toEqual(["url"]);
    }
  });

  it("never doubles the slash when the origin carries a trailing one", () => {
    const urls = buildSitemapEntries(`${ORIGIN}/`, ROUTE_PATHS, SLUGS).map(
      (entry) => entry.url,
    );
    expect(urls).toContain("https://example.com");
    expect(urls.some((url) => url.includes("//about"))).toBe(false);
  });

  it("collapses a repeated route or slug to one entry", () => {
    const urls = buildSitemapEntries(
      ORIGIN,
      [...ROUTE_PATHS, "/about"],
      [...SLUGS, "first-project"],
    ).map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("refuses to build a sitemap missing a navigation route", () => {
    expect(() => buildSitemapEntries(ORIGIN, ["/"], SLUGS)).toThrow(
      /ROUTE_PATHS/,
    );
  });
});
