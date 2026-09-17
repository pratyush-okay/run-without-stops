const SEARCH_CRAWLER_UA =
  /Googlebot|Google-InspectionTool|Storebot-Google|GoogleOther|bingbot|BingPreview|Slurp|DuckDuckBot|Baiduspider|YandexBot|Yandex|Applebot|facebookexternalhit|Twitterbot|LinkedInBot|Embedly|Quora Link Preview|Showyoubot|outbrain|pinterest|redditbot|Slackbot|vkShare|W3C_Validator|WhatsApp|TelegramBot|Discordbot|GPTBot|ChatGPT-User|ClaudeBot|anthropic-ai|Bytespider|CCBot|PerplexityBot/i;

export function isSearchCrawler(userAgent: string | null | undefined) {
  return Boolean(userAgent && SEARCH_CRAWLER_UA.test(userAgent));
}
