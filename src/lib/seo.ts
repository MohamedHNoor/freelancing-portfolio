import type { Metadata, MetadataRoute } from "next";
import { getProfile } from "@/content";
import { NAV_ITEMS, joinSiteUrl, type NavItem } from "@/lib/site";

/** Every static route this site owns, in the order the sitemap lists them.
 *
 *  Separate from `NAV_ITEMS` because the two answer different questions: the
 *  navigation is what a visitor is offered, and this is what exists. `/` is not
 *  in the navigation, and a future unlisted route would still belong here.
 *  `buildSitemapEntries` guards that this never drifts below the navigation. */
export const ROUTE_PATHS = [
  "/",
  "/about",
  "/services",
  "/projects",
  "/skills",
  "/experience",
  "/resume",
  "/contact",
] as const;

export type RouteMetadataOptions = {
  /** `article` for a case study, which is a written piece about one project
   *  rather than a page of the site itself. */
  type?: "website" | "article";
};

/** The canonical URL and `og:url` for one route, as a path.
 *
 *  Both come from one call on purpose: they must always agree, and the failure
 *  when they drift is silent. `metadataBase` on the root layout resolves the
 *  path against the configured origin, so nothing here concatenates strings.
 *
 *  `type` and `siteName` are repeated rather than inherited because a page's
 *  `openGraph` replaces the layout's object outright instead of merging into
 *  it, so a partial object here would drop `og:type` and `og:site_name` from
 *  every route that used it. */
export function routeMetadata(
  path: string,
  { type = "website" }: RouteMetadataOptions = {},
): Pick<Metadata, "alternates" | "openGraph"> {
  return {
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: getProfile().name,
      url: path,
    },
  };
}

/** Throws when the navigation offers a route the sitemap does not list.
 *
 *  The two lists are maintained by hand and are easy to let drift: adding a
 *  navigation item is the visible half of shipping a route, and forgetting the
 *  sitemap entry fails silently, since a missing URL looks exactly like a site
 *  that does not have that page. Failing the build is the only way that gets
 *  noticed.
 *
 *  Anchors are skipped. `NavLink` already treats an href containing `#` as an
 *  in-page link rather than a route, and a fragment is not a sitemap URL.
 *
 *  Takes the navigation as a parameter, defaulting to the real one, so the
 *  failure case is testable against a fixture. `assertContentInvariants` takes
 *  its input the same way and for the same reason. */
export function assertRoutesCoverNavigation(
  routes: readonly string[],
  navItems: readonly NavItem[] = NAV_ITEMS,
): void {
  for (const item of navItems) {
    if (item.href.includes("#")) {
      continue;
    }
    if (!routes.includes(item.href)) {
      throw new Error(
        `Sitemap: navigation item "${item.label}" points at ${item.href}, which is not in ROUTE_PATHS`,
      );
    }
  }
}

/** Every URL this site wants indexed: the static routes, then one case study
 *  per project, each absolute.
 *
 *  `lastModified` is deliberately absent. Nothing in this repository records
 *  when a route's content last changed, so the only value available would be
 *  the build time, which would tell a crawler that all eleven pages changed on
 *  every deploy. A missing date is honest; a fabricated one trains the crawler
 *  to ignore the field. `changeFrequency` and `priority` are omitted for the
 *  same reason, and Google ignores both regardless.
 *
 *  Placeholder projects are listed like any other. Blocking seeded content from
 *  production is feature 12's honesty gate, and a sitemap that quietly dropped
 *  them would hide the problem instead of stopping it. */
export function buildSitemapEntries(
  origin: string,
  routes: readonly string[],
  slugs: readonly string[],
): MetadataRoute.Sitemap {
  assertRoutesCoverNavigation(routes);

  const paths = [...routes, ...slugs.map((slug) => `/projects/${slug}`)];
  const seen = new Set<string>();

  for (const path of paths) {
    seen.add(joinSiteUrl(origin, path));
  }

  return [...seen].map((url) => ({ url }));
}
