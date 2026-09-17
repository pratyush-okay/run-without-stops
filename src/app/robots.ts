import type { MetadataRoute } from "next";
import { absoluteUrl, SSO_DISALLOW_PATHS } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...SSO_DISALLOW_PATHS],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
