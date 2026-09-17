import { headers } from "next/headers";
import { isSearchCrawler } from "@/lib/seo/search-crawler";

export async function requestIsSearchCrawler() {
  return isSearchCrawler((await headers()).get("user-agent"));
}
