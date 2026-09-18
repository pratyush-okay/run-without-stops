import {
  isSearchCrawler,
  markSearchCrawlerHeaders,
  requestLooksLikeSearchCrawler,
  SEARCH_CRAWLER_HEADER,
  shouldMountClerkProvider,
} from "@/lib/seo/search-crawler";

describe("search crawler detection", () => {
  it("treats Googlebot and the Search Console inspector as crawlers", () => {
    expect(
      isSearchCrawler("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"),
    ).toBe(true);
    expect(isSearchCrawler("Mozilla/5.0 (compatible; Google-InspectionTool/1.0)")).toBe(true);
    expect(isSearchCrawler("Mozilla/5.0 (Linux; Android 8.0; Pixel) Google-Read-Aloud")).toBe(true);
    expect(isSearchCrawler("AdsBot-Google (+http://www.google.com/adsbot.html)")).toBe(true);
    expect(isSearchCrawler("Mediapartners-Google")).toBe(true);
  });

  it("trusts the proxy crawler header when the UA header is dropped", () => {
    expect(requestLooksLikeSearchCrawler({ userAgent: null, crawlerHeader: "1" })).toBe(true);
    expect(shouldMountClerkProvider(null, "1")).toBe(false);
    const headers = markSearchCrawlerHeaders(
      new Headers({
        "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      }),
    );
    expect(headers.get(SEARCH_CRAWLER_HEADER)).toBe("1");
  });

  it("mounts Clerk for browsers and skips it for Googlebot", () => {
    expect(
      shouldMountClerkProvider(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toBe(true);
    expect(
      shouldMountClerkProvider(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ),
    ).toBe(false);
  });

  it("does not treat browsers as crawlers", () => {
    expect(
      isSearchCrawler(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toBe(false);
    expect(isSearchCrawler("")).toBe(false);
    expect(isSearchCrawler(undefined)).toBe(false);
  });
});
