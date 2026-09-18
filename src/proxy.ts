import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import { applyHomepageIndexRobotsTag } from "@/lib/seo/public-robots-header";
import { isSearchCrawler, markSearchCrawlerHeaders } from "@/lib/seo/search-crawler";

// Public-first: the map works without an account. Protect future signed-in
// routes individually with `auth.protect()`.
// Search crawlers skip Clerk so the development handshake cannot 307 Googlebot.
// Keep matcher strings in sync with CLERK_PROXY_MATCHER in clerk-proxy-matcher.ts
const clerk = clerkMiddleware((_auth, request) =>
  NextResponse.next({
    request: { headers: markSearchCrawlerHeaders(request.headers) },
  }),
);

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const pathname = request.nextUrl.pathname;

  if (isSearchCrawler(request.headers.get("user-agent"))) {
    const response = NextResponse.next({
      request: { headers: markSearchCrawlerHeaders(request.headers) },
    });
    applyHomepageIndexRobotsTag(pathname, response.headers);
    return response;
  }

  const response =
    (await clerk(request, event)) ??
    NextResponse.next({
      request: { headers: markSearchCrawlerHeaders(request.headers) },
    });
  applyHomepageIndexRobotsTag(pathname, response.headers);
  return response;
}

export const config = {
  matcher: [
    "/((?!ingest|_next|blog(?:/.*)?|sitemap\\.xml|robots\\.txt|llms\\.txt|\\.well-known(?:/.*)?|opengraph-image|apple-icon\\.png|icon\\.svg|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
