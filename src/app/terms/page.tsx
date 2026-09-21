import type { Metadata } from "next";
import Link from "next/link";
import { BlogBreadcrumbs } from "@/components/blog/blog-breadcrumbs";
import { BlogShell } from "@/components/blog/blog-shell";
import { breadcrumbListJsonLd } from "@/lib/seo/breadcrumbs";
import { JsonLd } from "@/lib/seo/json-ld";
import { TERMS_DESCRIPTION, TERMS_TITLE } from "@/lib/seo/public-copy";
import { absoluteUrl, defaultSocialImages, PUBLIC_PAGE_ROBOTS, SITE_NAME } from "@/lib/seo/site";

const TITLE = TERMS_TITLE;
const DESCRIPTION = TERMS_DESCRIPTION;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: PUBLIC_PAGE_ROBOTS,
  alternates: { canonical: "/terms" },
  openGraph: {
    url: "/terms",
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

const CREDIT_LINKS = [
  { href: "https://www.openstreetmap.org/copyright", label: "OpenStreetMap" },
  { href: "https://www.mapbox.com/about/maps", label: "Mapbox" },
  { href: "https://www.graphhopper.com", label: "GraphHopper" },
  { href: "https://valhalla.github.io/valhalla", label: "Valhalla" },
  { href: "https://stadiamaps.com", label: "Stadia Maps" },
  { href: "https://nominatim.org", label: "Nominatim" },
  { href: "https://overpass-api.de", label: "Overpass API" },
  { href: "https://www.tracestrack.com", label: "Tracestrack" },
  { href: "https://clerk.com", label: "Clerk" },
  { href: "https://supabase.com", label: "Supabase" },
  { href: "https://posthog.com", label: "PostHog" },
  { href: "https://sentry.io", label: "Sentry" },
  { href: "https://vercel.com", label: "Vercel" },
  { href: "https://nextjs.org", label: "Next.js" },
] as const;

export default function TermsPage() {
  const termsUrl = absoluteUrl("/terms");
  const crumbs = [
    { name: "Map", path: "/" },
    { name: "Terms", path: "/terms" },
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
            url: termsUrl,
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
      <p className="rws-kicker mt-3">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Terms and credits</h1>
      <p className="mt-3 text-sm text-white/45">Last updated 19 September 2026</p>

      <div className="blog-prose mt-6 max-w-2xl">
        <section>
          <h2>The planner</h2>
          <p>
            Run Without Stops is a free map-first running route planner at{" "}
            <Link href="/">runwithoutstops.com</Link>. Click the map, search a place, or start from
            where you are. You can plan a line, turn on layers, and export GPX, SVG, or an image
            without an account.
          </p>
          <p>
            The map is a planner, not a live traffic feed and not coaching. Lights, crossings, and
            roads come from mapped OpenStreetMap objects. They can be stale, missing, or in the
            wrong place. Check the street before you run it.
          </p>
        </section>

        <section>
          <h2>Accounts</h2>
          <p>
            Sign in is optional. An account lets you keep named routes, copy a private{" "}
            <code className="text-white/80">/r/</code> share link, and change the map look. Clerk
            handles sign-in, sign-up, Google sign-in, and email codes. Creating or using an account
            means you accept these terms.
          </p>
          <p>
            Pick a username you are happy to store with your routes. Do not upload other
            people&apos;s data, spam share links, or try to break the planner. We can close an
            account that is used to abuse the map, the APIs, or other runners.
          </p>
        </section>

        <section>
          <h2>Saved routes and data</h2>
          <p>
            Named routes sit in Supabase with your Clerk account. Share URLs stay out of the sitemap
            and out of search. Anyone with the link can open that line in the app.
          </p>
          <p>
            The site uses PostHog to see how the planner is used, and Sentry to catch errors. Map
            search, routing, and layers call the services listed below for the streets on screen. We
            do not sell route lists. Delete a saved route from the saved-routes panel, or ask for
            account deletion through the same Clerk email you signed in with.
          </p>
        </section>

        <section>
          <h2>Credits</h2>
          <p>
            The map would not draw without other people&apos;s work. Run Without Stops uses these
            services and is not those products.
          </p>
          <ul>
            <li>
              <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors,
              under the <a href="https://opendatacommons.org/licenses/odbl/">ODbL</a>. Overlays,
              place search fallbacks, and the street graph come from that map.
            </li>
            <li>
              <a href="https://www.mapbox.com/about/maps">Mapbox</a> for Dark, Streets, and
              Satellite basemaps. © Mapbox.{" "}
              <a href="https://www.mapbox.com/map-feedback">Improve this map</a>.
            </li>
            <li>
              <a href="https://www.graphhopper.com">GraphHopper</a> for pedestrian routing, with{" "}
              <a href="https://valhalla.github.io/valhalla">Valhalla</a> on the FOSSGIS public
              instance as a backup.
            </li>
            <li>
              <a href="https://stadiamaps.com">Stadia Maps</a> and{" "}
              <a href="https://nominatim.org">Nominatim</a> for place search and reverse geocoding.
              Nominatim is an OpenStreetMap project.
            </li>
            <li>
              <a href="https://overpass-api.de">Overpass API</a>, kumi.systems, and{" "}
              <a href="https://www.tracestrack.com">Tracestrack</a> for traffic lights, crossings,
              and drinking water in the current viewport.
            </li>
            <li>
              <a href="https://clerk.com">Clerk</a> for accounts and{" "}
              <a href="https://policies.google.com/terms">Google</a> for Continue with Google.
            </li>
            <li>
              <a href="https://supabase.com">Supabase</a> for saved routes,{" "}
              <a href="https://posthog.com">PostHog</a> for product analytics, and{" "}
              <a href="https://sentry.io">Sentry</a> for error reports.
            </li>
            <li>
              <a href="https://nextjs.org">Next.js</a> and <a href="https://vercel.com">Vercel</a>{" "}
              for the app and the live host.
            </li>
          </ul>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {CREDIT_LINKS.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </p>
        </section>

        <section>
          <h2>Limits</h2>
          <p>
            The planner is provided as is. A suggested line can still put you on a shoulder, a
            closed gate, or a light that is not on the map. You choose where you run. We are not
            liable for injury, lost time, or a route that did not match the street.
          </p>
          <p>
            These terms can change when the product does. The date at the top is the current
            version. Questions about this page can go to the{" "}
            <a href="https://github.com/pratyush-okay/run-without-stops">
              Run Without Stops GitHub repository
            </a>
            .
          </p>
        </section>
      </div>
    </BlogShell>
  );
}
