import type { Metadata, MetadataRoute } from "next";
import { getProfile } from "@/content";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import {
  BACKGROUND_LINKS,
  NAV_ITEMS,
  joinSiteUrl,
  type NavItem,
} from "@/lib/site";

/** Every static route this site owns, in the order the sitemap lists them.
 *
 *  Separate from `NAV_ITEMS` because the two answer different questions: the
 *  navigation is what a visitor is offered, and this is what exists. A future
 *  unlisted route would still belong here. `buildSitemapEntries` guards that
 *  this never drifts below the navigation or the footer's background links. */
export const ROUTE_PATHS = [
  "/",
  "/services",
  "/projects",
  "/process",
  "/about",
  "/skills",
  "/experience",
  "/resume",
  "/contact",
] as const;

/** Describes the site card, which is what a screen reader user gets instead of
 *  it. Not a copy of the page title: the title is already read out beside it.
 *  The root `opengraph-image` exports this same string, so the file and the
 *  metadata cannot describe the card differently. */
export const SITE_CARD_ALT = `A dark title card for ${getProfile().name}, ${getProfile().role.toLowerCase()} in Wellington, New Zealand, showing the tagline "${getProfile().headline}" above the four services.`;

/** The card `src/app/opengraph-image.tsx` renders, as an Open Graph image.
 *  The path resolves against `metadataBase`, as `og:url` does. */
export const SITE_CARD = {
  url: "/opengraph-image",
  ...OG_SIZE,
  type: OG_CONTENT_TYPE,
  alt: SITE_CARD_ALT,
};

export type RouteMetadataOptions = {
  /** `article` for a case study, which is a written piece about one project
   *  rather than a page of the site itself. */
  type?: "website" | "article";
  /** The route's segment has its own `opengraph-image` file. The site card is
   *  then left off, because an explicit image here would replace that file's. */
  ownImage?: boolean;
};

/** The canonical URL and `og:url` for one route, as a path.
 *
 *  Both come from one call on purpose: they must always agree, and the failure
 *  when they drift is silent. `metadataBase` on the root layout resolves the
 *  path against the configured origin, so nothing here concatenates strings.
 *
 *  `type`, `siteName` and the site card are repeated rather than inherited
 *  because a page's `openGraph` replaces the layout's object outright instead
 *  of merging into it, so a partial object here would drop `og:type`,
 *  `og:site_name` and `og:image` from every route that used it. The root
 *  image file only reaches `/`, which shares its segment. Next copies the
 *  image into `twitter:image`, since no route sets one.
 *
 *  With `ownImage`, the `images` key is left out rather than set to
 *  `undefined`: an explicit `undefined` blocks the segment's image file too. */
export function routeMetadata(
  path: string,
  { type = "website", ownImage = false }: RouteMetadataOptions = {},
): Pick<Metadata, "alternates" | "openGraph"> {
  return {
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: getProfile().name,
      url: path,
      ...(ownImage ? {} : { images: [SITE_CARD] }),
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
  navItems: readonly NavItem[] = [...NAV_ITEMS, ...BACKGROUND_LINKS],
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
