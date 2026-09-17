import type { Metadata } from "next";
import Link from "next/link";
import { BlogBreadcrumbs } from "@/components/blog/blog-breadcrumbs";
import { BlogShell } from "@/components/blog/blog-shell";
import { listPublishedPosts } from "@/lib/blog/posts";
import { breadcrumbListJsonLd } from "@/lib/seo/breadcrumbs";
import { JsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Quieter running route notes",
  description:
    "Notes on planning runs with fewer traffic lights, highways, and busy streets, then drawing the line on the Run Without Stops map.",
  alternates: { canonical: "/blog" },
  openGraph: {
    url: "/blog",
    title: "Quieter running route notes",
    description:
      "Notes on planning runs with fewer traffic lights, highways, and busy streets, then drawing the line on the Run Without Stops map.",
  },
};

export default function BlogIndexPage() {
  const posts = listPublishedPosts();
  const blogUrl = absoluteUrl("/blog");
  const crumbs = [
    { name: "Map", path: "/" },
    { name: "Quieter route notes", path: "/blog" },
  ];

  return (
    <BlogShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Quieter running route notes",
            description:
              "Notes on planning runs with fewer traffic lights, highways, and busy streets, then drawing the line on the Run Without Stops map.",
            url: blogUrl,
            isPartOf: {
              "@type": "WebSite",
              name: SITE_NAME,
              url: absoluteUrl("/"),
              description: SITE_DESCRIPTION,
            },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: posts.map((post, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: absoluteUrl(`/blog/${post.slug}`),
                name: post.title,
              })),
            },
          },
          breadcrumbListJsonLd(crumbs),
        ]}
      />
      <BlogBreadcrumbs items={crumbs} />
      <p className="rws-kicker mt-3">Blog</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Quieter running route notes</h1>
      <div className="mt-3 max-w-2xl space-y-4 text-sm leading-6 text-white/65">
        <p>
          These notes sit next to the{" "}
          <Link className="text-[#c8ff52] underline-offset-2 hover:underline" href="/">
            Run Without Stops map
          </Link>
          . The planner is free and worldwide: click the map, search a place, or start from where
          you are. Low-stop routing can skip traffic lights, highways, and busy roads. The notes
          explain what those layers mean before you draw a line you will actually run.
        </p>
        <p>
          A short path on a generic map still sends you through every signal on the shortest legal
          walk. The wait is on the watch even if you never count it. These pages treat that wait as
          part of the route: which marks are lights, which are crossings, when to use low-stop, and
          when a direct line through a park you already know is the better click.
        </p>
        <p>
          Start with{" "}
          <Link
            className="text-[#c8ff52] underline-offset-2 hover:underline"
            href="/blog/the-complete-guide-to-building-a-run-without-stops"
          >
            the complete guide to building a run without stops
          </Link>
          . It covers low-stop versus direct, avoid elevation, overlays, and how to save or share a
          line if you want a link later. Then read{" "}
          <Link
            className="text-[#c8ff52] underline-offset-2 hover:underline"
            href="/blog/a-runners-guide-to-traffic-lights-crossings-and-route-intelligence"
          >
            the traffic lights and crossings note
          </Link>{" "}
          for OpenStreetMap marks, busy-road avoidance, and a checklist you can use on the same map.
        </p>
        <p>
          Open the map when you finish a note. Drop a start, turn on the layers the page named, and
          move a waypoint if a remaining light still sits on a corner you refuse to wait at. Sign in
          only if you want to keep the line or share it. Exporting GPX or an image does not need an
          account.
        </p>
      </div>
      {posts.length === 0 ? (
        <p className="mt-10 text-sm text-white/55">No notes yet.</p>
      ) : (
        <ul className="mt-10 grid gap-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="rws-panel block p-5 transition hover:border-white/20"
              >
                <p className="text-[11px] text-white/45">{post.date}</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">{post.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/65">{post.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </BlogShell>
  );
}
