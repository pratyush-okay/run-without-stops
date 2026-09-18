import type { Metadata } from "next";
import Link from "next/link";
import { BlogBreadcrumbs } from "@/components/blog/blog-breadcrumbs";
import { BlogShell } from "@/components/blog/blog-shell";
import { listPublishedPosts } from "@/lib/blog/posts";
import { breadcrumbListJsonLd } from "@/lib/seo/breadcrumbs";
import { JsonLd } from "@/lib/seo/json-ld";
import {
  absoluteUrl,
  defaultSocialImages,
  PUBLIC_PAGE_ROBOTS,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Quieter running route notes",
  description:
    "Notes on planning runs with fewer traffic lights, highways, and busy streets, then drawing the line on the Run Without Stops map.",
  robots: PUBLIC_PAGE_ROBOTS,
  alternates: { canonical: "/blog" },
  openGraph: {
    url: "/blog",
    title: "Quieter running route notes",
    description:
      "Notes on planning runs with fewer traffic lights, highways, and busy streets, then drawing the line on the Run Without Stops map.",
    images: defaultSocialImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Quieter running route notes",
    description:
      "Notes on planning runs with fewer traffic lights, highways, and busy streets, then drawing the line on the Run Without Stops map.",
    images: defaultSocialImages(),
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
          Then follow{" "}
          <Link
            className="text-[#c8ff52] underline-offset-2 hover:underline"
            href="/blog/how-to-build-low-stop-running-routes-with-run-without-stops"
          >
            how to build low-stop running routes
          </Link>{" "}
          for the quieter-street click sequence, or{" "}
          <Link
            className="text-[#c8ff52] underline-offset-2 hover:underline"
            href="/blog/how-to-use-the-run-without-stops-route-builder"
          >
            how to use the Route builder
          </Link>{" "}
          when Direct, start, and finish are the job, or{" "}
          <Link
            className="text-[#c8ff52] underline-offset-2 hover:underline"
            href="/blog/flat-running-routes-vs-direct-routes-which-is-right-for-your-run"
          >
            flat running routes vs Direct
          </Link>{" "}
          when the profile is the decision.
        </p>
        <p>
          Open the map when you finish a note. Drop a start, turn on the layers the page named, and
          move a waypoint if a remaining light still sits on a corner you refuse to wait at. Sign in
          only if you want to keep the line or share it. Exporting GPX or an image does not need an
          account.
        </p>
      </div>
      <div className="mt-10 max-w-2xl space-y-4 text-sm leading-6 text-white/65">
        <h2 className="text-xl font-semibold tracking-tight text-[#f4f7f5]">
          Which note to open first
        </h2>
        <p>
          Use the complete guide if you have not drawn a line here yet. It names Direct, Low stops,
          Avoid hills, and the overlays, then sends you back to the map. Use the traffic-lights note
          when the remaining marks on a line are the question: which objects are signals, which are
          crossings, and which busy-road or highway layer you should turn on before you move a
          waypoint.
        </p>
        <p>
          Use the low-stop how-to when the weekday request is fewer waits, not a park loop you
          already run. Use the Route builder how-to when start, finish, and Direct are enough, and
          you only need waypoints if the legal walk is ugly. Use the flat-vs-Direct note when the
          climb is the decision: Avoid hills lives under Low stops only, so a Direct line will not
          flatten a hill for you.
        </p>
      </div>
      <div className="mt-10 max-w-2xl space-y-4 text-sm leading-6 text-white/65">
        <h2 className="text-xl font-semibold tracking-tight text-[#f4f7f5]">
          What these notes will not do
        </h2>
        <p>
          They do not replace the map. Routing still runs on the streets in the viewport. A
          country-scale view will not load lights you can actually wait at. The marks are
          OpenStreetMap objects for that view, not a live countdown on the pole. A remaining light
          after Low stops is a wait you should expect, not a bug in the note.
        </p>
        <p>
          Private share URLs at <code className="text-white/80">/r/</code> stay out of this index
          and out of search. The notes link the public map and each other. If a sentence in a note
          and a toggle on the panel disagree, trust the panel: Avoid hills is hidden until Low stops
          is selected.
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
