import { listPublishedPosts } from "@/lib/blog/posts";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/seo/site";

export function GET() {
  const posts = listPublishedPosts();
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Pages",
    "",
    `- [${SITE_TITLE}](${absoluteUrl("/")})`,
    `- [Blog](${absoluteUrl("/blog")})`,
    ...posts.map((post) => `- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)})`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
