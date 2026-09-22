import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/blog/posts";
import { absoluteUrl, sitemapPaths } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = listPublishedPosts();
  const dates = Object.fromEntries(posts.map((post) => [`/blog/${post.slug}`, post.date]));
  const hubDates: Record<string, string> = {
    "/": "2026-09-18",
    "/blog": "2026-09-18",
    "/terms": "2026-09-19",
    "/help": "2026-09-22",
  };

  return sitemapPaths(posts.map((post) => post.slug)).map((path) => {
    const lastModified = dates[path] ?? hubDates[path];
    if (lastModified) {
      return { url: absoluteUrl(path), lastModified };
    }
    return { url: absoluteUrl(path) };
  });
}
