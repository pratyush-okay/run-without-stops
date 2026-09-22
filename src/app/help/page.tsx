import type { Metadata } from "next";
import Link from "next/link";
import { BlogBreadcrumbs } from "@/components/blog/blog-breadcrumbs";
import { BlogShell } from "@/components/blog/blog-shell";
import { breadcrumbListJsonLd } from "@/lib/seo/breadcrumbs";
import { JsonLd } from "@/lib/seo/json-ld";
import { HELP_DESCRIPTION, HELP_TITLE } from "@/lib/seo/public-copy";
import { absoluteUrl, defaultSocialImages, PUBLIC_PAGE_ROBOTS, SITE_NAME } from "@/lib/seo/site";

const TITLE = HELP_TITLE;
const DESCRIPTION = HELP_DESCRIPTION;

const NOTES = [
  {
    href: "/blog/why-the-next-click-should-feel-instant",
    label: "Why the next click should feel instant",
  },
  {
    href: "/blog/keyboard-shortcuts-for-the-planner",
    label: "Keyboard shortcuts for the planner",
  },
  {
    href: "/blog/how-to-read-the-elevation-chart",
    label: "How to read the elevation chart",
  },
  {
    href: "/blog/shortest-path-versus-fewer-lights",
    label: "Shortest path versus fewer lights",
  },
  {
    href: "/blog/edit-a-line-without-starting-over",
    label: "Edit a line without starting over",
  },
] as const;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: PUBLIC_PAGE_ROBOTS,
  alternates: { canonical: "/help" },
  openGraph: {
    url: "/help",
    title: TITLE,
    description: DESCRIPTION,
    images: defaultSocialImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: defaultSocialImages(),
  },
};

export default function HelpPage() {
  const helpUrl = absoluteUrl("/help");
  const crumbs = [
    { name: "Map", path: "/" },
    { name: "Help", path: "/help" },
  ];

  return (
    <BlogShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: TITLE,
            description: DESCRIPTION,
            url: helpUrl,
            isPartOf: {
              "@type": "WebSite",
              name: SITE_NAME,
              url: absoluteUrl("/"),
            },
          },
          breadcrumbListJsonLd(crumbs),
        ]}
      />
      <BlogBreadcrumbs items={crumbs} />
      <p className="rws-kicker mt-3">Help</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Use the route planner</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
        The map is the planner. These are the moves that build a line, keep it, and send it
        somewhere else.
      </p>

      <div className="blog-prose mt-6 max-w-2xl">
        <h2>Click to add a point</h2>
        <p>
          Click empty map to drop the next stop. The first click is the start. The next click is the
          finish, or another corner if you want a longer line. Search a place or use your location
          when you are not looking at the right streets. Press Space to drop a point at the center
          of the map.
        </p>
        <h2>Drag a point</h2>
        <p>
          Drag a stop to move it. Drag the route line itself, not a stop, and release to insert a
          waypoint on that stretch. Shift-click a stop to remove it. Delete removes the last point.
        </p>
        <h2>Undo</h2>
        <p>
          Undo takes back the last point. Redo puts it back. The keys are Z, and Shift+Z or Y. Press
          ? on the map for the full list.
        </p>
        <h2>Direct versus Low stops</h2>
        <p>
          Direct follows your clicks on pedestrian streets. Low stops spends extra work avoiding
          lights and busy roads, so that request is slower and can fall back to Direct when the
          quieter line will not draw. R switches the two. Avoid hills is a separate switch on Low
          stops.
        </p>
        <h2>Save</h2>
        <p>
          A line stays on the map while the tab is open. Sign in to name it and keep it in Saved
          routes. Saving is optional. You can plan without an account.
        </p>
        <h2>Share</h2>
        <p>
          A saved route can copy a private link. The person who opens it sees the same stops and the
          line. The link is not a public directory.
        </p>
        <h2>GPX</h2>
        <p>
          Export GPX from the route actions when a line exists. SVG and an image are there too. The
          file is the geometry on the map, ready for a watch or another app.
        </p>
        <h2>Notes</h2>
        <ul>
          {NOTES.map((note) => (
            <li key={note.href}>
              <Link href={note.href}>{note.label}</Link>
            </li>
          ))}
          <li>
            <Link href="/blog">All quieter route notes</Link>
          </li>
        </ul>
      </div>
    </BlogShell>
  );
}
