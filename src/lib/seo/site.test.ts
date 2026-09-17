import {
  absoluteUrl,
  PRODUCTION_SITE_ORIGIN,
  resolveSiteOrigin,
  SSO_DISALLOW_PATHS,
  sitemapPaths,
} from "@/lib/seo/site";

describe("site origin", () => {
  it("keeps localhost URLs outside production", () => {
    expect(resolveSiteOrigin("http://localhost:3000", "development")).toBe("http://localhost:3000");
    expect(resolveSiteOrigin("http://localhost:3000/", "test")).toBe("http://localhost:3000");
  });

  it("falls back to www in production when the app URL is local", () => {
    expect(resolveSiteOrigin("http://localhost:3000", "production")).toBe(PRODUCTION_SITE_ORIGIN);
    expect(resolveSiteOrigin("http://127.0.0.1:3000", "production")).toBe(PRODUCTION_SITE_ORIGIN);
  });

  it("keeps a public production URL", () => {
    expect(resolveSiteOrigin("https://www.runwithoutstops.com", "production")).toBe(
      PRODUCTION_SITE_ORIGIN,
    );
  });
});

describe("public URL lists", () => {
  it("builds sitemap paths without SSO or share routes", () => {
    const paths = sitemapPaths(["the-complete-guide-to-building-a-run-without-stops"]);
    expect(paths).toEqual([
      "/",
      "/blog",
      "/blog/the-complete-guide-to-building-a-run-without-stops",
    ]);
    expect(paths.some((path) => path.startsWith("/sso-"))).toBe(false);
    expect(paths.some((path) => path.startsWith("/r/"))).toBe(false);
  });

  it("keeps Clerk callbacks off the public inventory", () => {
    expect([...SSO_DISALLOW_PATHS]).toEqual(["/sso-callback", "/sso-continue"]);
  });

  it("joins origin and path without a double slash", () => {
    expect(absoluteUrl("/", PRODUCTION_SITE_ORIGIN)).toBe(`${PRODUCTION_SITE_ORIGIN}/`);
    expect(absoluteUrl("/blog", PRODUCTION_SITE_ORIGIN)).toBe(`${PRODUCTION_SITE_ORIGIN}/blog`);
  });
});
