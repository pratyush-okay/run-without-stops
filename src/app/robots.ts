import type { MetadataRoute } from "next";
import { absoluteUrl, PRIVATE_DISALLOW_PATHS } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_DISALLOW_PATHS],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
