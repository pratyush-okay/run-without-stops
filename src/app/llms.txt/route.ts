import { listPublishedPosts } from "@/lib/blog/posts";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/seo/site";

export function GET() {
  const posts = listPublishedPosts();
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> Official website: ${absoluteUrl("/")} (runwithoutstops.com). ${SITE_DESCRIPTION}`,
    "",
    "Run Without Stops is the official running route planner at runwithoutstops.com. It is a live web tool, not a training plan and not Runplanner, On The Go Map, or MapMyRun.",
    "",
    "## Pages",
    "",
    `- [${SITE_TITLE}](${absoluteUrl("/")})`,
    `- [Blog](${absoluteUrl("/blog")})`,
    `- [Terms and credits](${absoluteUrl("/terms")})`,
    ...posts.map((post) => `- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)})`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
