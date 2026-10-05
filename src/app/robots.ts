import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { buildRobotsPolicy } from "@/lib/robots";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsPolicy(absoluteUrl("/sitemap.xml"));
}
