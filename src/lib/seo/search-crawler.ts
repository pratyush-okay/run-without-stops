const SEARCH_CRAWLER_UA =
  /Googlebot|Google-InspectionTool|Google-Read-Aloud|Google-CloudVertexBot|Google-Safety|GoogleProducer|GoogleOther|Storebot-Google|AdsBot-Google|FeedFetcher-Google|DuplexWeb-Google|Mediapartners-Google|APIs-Google|Google-Extended|Google-NotebookLM|GoogleAgent|bingbot|BingPreview|Slurp|DuckDuckBot|Baiduspider|YandexBot|Yandex|Applebot|facebookexternalhit|Twitterbot|LinkedInBot|Embedly|Quora Link Preview|Showyoubot|outbrain|pinterest|redditbot|Slackbot|vkShare|W3C_Validator|WhatsApp|TelegramBot|Discordbot|GPTBot|ChatGPT-User|ClaudeBot|anthropic-ai|Bytespider|CCBot|PerplexityBot/i;

export const SEARCH_CRAWLER_HEADER = "x-search-crawler";

export function isSearchCrawler(userAgent: string | null | undefined) {
  return Boolean(userAgent && SEARCH_CRAWLER_UA.test(userAgent));
}

export function requestLooksLikeSearchCrawler(input: {
  userAgent?: string | null | undefined;
  crawlerHeader?: string | null | undefined;
}) {
  return isSearchCrawler(input.userAgent) || input.crawlerHeader === "1";
}

export function markSearchCrawlerHeaders(headers: Headers) {
  const next = new Headers(headers);
  // Never trust a marker supplied by the client. The proxy sets it only after
  // matching the request's User-Agent.
  next.delete(SEARCH_CRAWLER_HEADER);
  if (isSearchCrawler(headers.get("user-agent"))) {
    next.set(SEARCH_CRAWLER_HEADER, "1");
  }
  return next;
}

/** People still get Clerk on first paint. Crawlers skip the provider so HTML does not ship accounts.dev. */
export function shouldMountClerkProvider(
  userAgent: string | null | undefined,
  crawlerHeader?: string | null,
) {
  return !requestLooksLikeSearchCrawler({ userAgent, crawlerHeader });
}
