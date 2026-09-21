import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import { isClerkProxyPath } from "@/lib/auth/clerk-proxy-matcher";
import { APEX_TO_WWW_STATUS, isApexHostname, wwwUrlFor } from "@/lib/seo/host-redirect";
import { applyHsts } from "@/lib/seo/hsts";
import { applyHomepageIndexRobotsTag } from "@/lib/seo/public-robots-header";
import { isSearchCrawler, markSearchCrawlerHeaders } from "@/lib/seo/search-crawler";

// Public-first: the map works without an account. Protect future signed-in
// routes individually with `auth.protect()`.
// Search crawlers skip Clerk so the development handshake cannot 307 Googlebot.
const clerk = clerkMiddleware((_auth, request) =>
  NextResponse.next({
    request: { headers: markSearchCrawlerHeaders(request.headers) },
  }),
);

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host") ?? request.nextUrl.hostname;
  if (isApexHostname(host)) {
    const response = NextResponse.redirect(wwwUrlFor(request.nextUrl), APEX_TO_WWW_STATUS);
    applyHsts(response.headers);
    return response;
  }

  if (isSearchCrawler(request.headers.get("user-agent")) || !isClerkProxyPath(pathname)) {
    const response = NextResponse.next({
      request: { headers: markSearchCrawlerHeaders(request.headers) },
    });
    applyHsts(response.headers);
    applyHomepageIndexRobotsTag(pathname, response.headers);
    return response;
  }

  const response =
    (await clerk(request, event)) ??
    NextResponse.next({
      request: { headers: markSearchCrawlerHeaders(request.headers) },
    });
  applyHsts(response.headers);
  applyHomepageIndexRobotsTag(pathname, response.headers);
  return response;
}

export const config = {
  matcher: [
    "/((?!ingest|_next|blog(?:/.*)?|terms|sitemap\\.xml|robots\\.txt|llms\\.txt|\\.well-known(?:/.*)?|opengraph-image|apple-icon\\.png|icon\\.svg|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/blog",
    "/blog/:path*",
    "/terms",
    "/sitemap.xml",
    "/robots.txt",
    "/llms.txt",
  ],
};
