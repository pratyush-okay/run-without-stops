import { env } from "@/env";

export const PRODUCTION_SITE_ORIGIN = "https://www.runwithoutstops.com";
export const SITE_NAME = "Run Without Stops";
export const SITE_TITLE = "Run Planner | Run Without Stops";
export const SITE_DESCRIPTION =
  "Free running route planner. Click the map or search a place anywhere, then skip traffic lights, highways, and busy roads. Optional save and share.";
export const SSO_DISALLOW_PATHS = ["/sso-callback", "/sso-continue"] as const;
export const OG_IMAGE_PATH = "/opengraph-image";
export const OG_IMAGE_ALT = "Run Without Stops — quieter running routes";
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const PUBLIC_PAGE_ROBOTS = { index: true, follow: true } as const;

export function defaultSocialImages() {
  return [
    {
      url: OG_IMAGE_PATH,
      width: OG_IMAGE_SIZE.width,
      height: OG_IMAGE_SIZE.height,
      alt: OG_IMAGE_ALT,
    },
  ];
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isVercelHostname(hostname: string) {
  return hostname === "vercel.app" || hostname.endsWith(".vercel.app");
}

export function resolveSiteOrigin(appUrl: string, nodeEnv: string) {
  const trimmed = appUrl.replace(/\/$/, "");
  if (nodeEnv !== "production") {
    return trimmed;
  }
  try {
    const hostname = new URL(trimmed).hostname;
    if (isLocalHostname(hostname) || isVercelHostname(hostname)) {
      return PRODUCTION_SITE_ORIGIN;
    }
  } catch {
    return PRODUCTION_SITE_ORIGIN;
  }
  return trimmed;
}

export function siteOrigin() {
  return resolveSiteOrigin(env.NEXT_PUBLIC_APP_URL, env.NODE_ENV);
}

export function sitemapPaths(postSlugs: string[]) {
  return ["/", "/blog", "/terms", ...postSlugs.map((slug) => `/blog/${slug}`)];
}

export function absoluteUrl(path: string, origin = siteOrigin()) {
  if (path === "/") {
    return origin;
  }
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
