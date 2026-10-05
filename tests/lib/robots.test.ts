import { describe, expect, it } from "vitest";
import { buildRobotsPolicy } from "@/lib/robots";

describe("buildRobotsPolicy", () => {
  const sitemap = "https://portfolio.example/sitemap.xml";

  it("allows public crawling while disallowing every planned private prefix", () => {
    expect(buildRobotsPolicy(sitemap)).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard", "/pay/", "/payment/", "/login", "/register",
          "/forgot-password", "/reset-password", "/verify-email", "/api/",
        ],
      },
      sitemap,
    });
  });

  it("uses the supplied absolute sitemap URL without changing its origin", () => {
    const url = "https://preview.example/sitemap.xml";
    expect(buildRobotsPolicy(url).sitemap).toBe(url);
  });
});
