import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/content";
import { ROUTE_PATHS, buildSitemapEntries } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

/* A thin adapter over `buildSitemapEntries`, which holds the logic and the
   tests. Static: nothing here reads a request. */
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries(SITE_URL, ROUTE_PATHS, getProjectSlugs());
}
