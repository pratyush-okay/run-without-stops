/** Paths Clerk middleware should not run on (crawler files and the blog). */
export const CLERK_PROXY_EXCLUSION =
  "ingest|_next|blog(?:/.*)?|sitemap\\.xml|robots\\.txt|llms\\.txt|\\.well-known(?:/.*)?|opengraph-image|apple-icon\\.png|icon\\.svg|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)";

export const CLERK_PROXY_MATCHER = [
  `/((?!${CLERK_PROXY_EXCLUSION}).*)`,
  "/(api|trpc)(.*)",
] as const;

export function isClerkProxyPath(pathname: string) {
  const first = new RegExp(`^/((?!${CLERK_PROXY_EXCLUSION}).*)$`);
  const api = /^\/(api|trpc)(.*)$/;
  return first.test(pathname) || api.test(pathname);
}
