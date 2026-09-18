import { headers } from "next/headers";
import { requestLooksLikeSearchCrawler, SEARCH_CRAWLER_HEADER } from "@/lib/seo/search-crawler";

export async function requestIsSearchCrawler() {
  const requestHeaders = await headers();
  return requestLooksLikeSearchCrawler({
    userAgent: requestHeaders.get("user-agent"),
    crawlerHeader: requestHeaders.get(SEARCH_CRAWLER_HEADER),
  });
}
