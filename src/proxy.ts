import { clerkMiddleware } from "@clerk/nextjs/server";

// Public-first: the map works without an account. Protect future signed-in
// routes individually with `auth.protect()`.
// Indexable pages are outside this matcher so Clerk's development handshake
// cannot 307 Googlebot (GSC "Redirect error").
// Keep in sync with CLERK_PROXY_MATCHER in src/lib/auth/clerk-proxy-matcher.ts
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!$|ingest|_next|blog(?:/.*)?|sitemap\\.xml|robots\\.txt|llms\\.txt|\\.well-known(?:/.*)?|opengraph-image|apple-icon\\.png|icon\\.svg|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
