import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/* Nothing on this site is private, so nothing is disallowed. The one job here
   is pointing a crawler at the sitemap with an absolute URL, which the
   robots.txt format requires. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
