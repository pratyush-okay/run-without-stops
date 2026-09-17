import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/blog/posts";
import { absoluteUrl, sitemapPaths } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = listPublishedPosts();
  const dates = Object.fromEntries(posts.map((post) => [`/blog/${post.slug}`, post.date]));

  return sitemapPaths(posts.map((post) => post.slug)).map((path) => {
    const lastModified = dates[path];
    if (lastModified) {
      return { url: absoluteUrl(path), lastModified };
    }
    return { url: absoluteUrl(path) };
  });
}
