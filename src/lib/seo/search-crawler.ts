const SEARCH_CRAWLER_UA =
  /Googlebot|Google-InspectionTool|Google-Read-Aloud|Google-CloudVertexBot|Google-Safety|GoogleProducer|GoogleOther|Storebot-Google|AdsBot-Google|FeedFetcher-Google|DuplexWeb-Google|bingbot|BingPreview|Slurp|DuckDuckBot|Baiduspider|YandexBot|Yandex|Applebot|facebookexternalhit|Twitterbot|LinkedInBot|Embedly|Quora Link Preview|Showyoubot|outbrain|pinterest|redditbot|Slackbot|vkShare|W3C_Validator|WhatsApp|TelegramBot|Discordbot|GPTBot|ChatGPT-User|ClaudeBot|anthropic-ai|Bytespider|CCBot|PerplexityBot/i;

export function isSearchCrawler(userAgent: string | null | undefined) {
  return Boolean(userAgent && SEARCH_CRAWLER_UA.test(userAgent));
}

/** People still get Clerk on first paint. Crawlers skip the provider so HTML does not ship accounts.dev. */
export function shouldMountClerkProvider(userAgent: string | null | undefined) {
  return !isSearchCrawler(userAgent);
}
