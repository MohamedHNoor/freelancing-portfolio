import type { MetadataRoute } from "next";

/** Crawler guidance for planned private routes; authorization is separate. */
export function buildRobotsPolicy(sitemapUrl: string): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/pay/",
        "/payment/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/api/",
      ],
    },
    sitemap: sitemapUrl,
  };
}
