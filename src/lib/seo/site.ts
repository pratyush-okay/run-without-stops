import { env } from "@/env";

export const PRODUCTION_SITE_ORIGIN = "https://www.runwithoutstops.com";
export const SITE_NAME = "Run Without Stops";
export const SITE_TITLE = "Quieter Sydney running routes | Run Without Stops";
export const SITE_DESCRIPTION =
  "Free Sydney running route planner. Click the map or search a place, then skip traffic lights, highways, and busy roads. Optional save and share.";
export const SSO_DISALLOW_PATHS = ["/sso-callback", "/sso-continue"] as const;

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function resolveSiteOrigin(appUrl: string, nodeEnv: string) {
  const trimmed = appUrl.replace(/\/$/, "");
  if (nodeEnv !== "production") {
    return trimmed;
  }
  try {
    if (isLocalHostname(new URL(trimmed).hostname)) {
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
  return ["/", "/blog", ...postSlugs.map((slug) => `/blog/${slug}`)];
}

export function absoluteUrl(path: string, origin = siteOrigin()) {
  if (path === "/") {
    return `${origin}/`;
  }
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
