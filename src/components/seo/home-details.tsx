import Link from "next/link";
import { HOME_FAQS } from "@/lib/seo/home-faqs";

export function HomeDetails() {
  return (
    <section className="border-t border-white/10 bg-[#0a0d0b] px-4 py-10 text-[#f4f7f5]">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <p className="rws-kicker">How it works</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Draw a run, then pull it off the waits
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-6 text-white/65">
            <p>
              The map above is the product. Click a start, add a finish, or search a suburb. The
              Route builder panel then asks for a pedestrian line between those points. You can
              export GPX, SVG, or an image without an account. Sign in only to save a named line or
              share a private <code className="text-white/80">/r/</code> link. Those share URLs stay
              out of search.
            </p>
            <p>
              Search any city, zoom to the streets you actually run, or start from where you are.
              The map still opens on Sydney if the browser has no location yet. Routing and overlays
              load for the viewport, not for a whole country at once, so a quiet line in Melbourne,
              London, or a suburb you just moved to is the same click as a loop around the park you
              already know.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Direct, Low stops, and Avoid hills
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-6 text-white/65">
            <p>
              Direct follows the order of your clicks on legal pedestrian streets. Use it for a park
              loop or a gate you already take. It will not invent extra parks to skip a light.
              Motorways still cost more than a back street, so the line is less likely to dump you
              on a shoulder.
            </p>
            <p>
              Low stops prefers streets with fewer traffic lights and tries to keep off highways and
              busy roads when a quieter legal line exists. That is the weekday request when you do
              not already know the lights. Avoid hills only appears after Low stops is selected. It
              raises the cost of steep slopes so extra metres can win if they cut the climb. A flat
              highway shoulder is still a chopped run.
            </p>
            <p>
              Mix both on one saved route when the session has two jobs: Low stops to the park gate,
              Direct around the loop you always run, Low stops home on a different street so you do
              not repeat the same lights.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-tight">What the layers mark</h2>
          <div className="mt-4 space-y-4 text-sm leading-6 text-white/65">
            <p>
              Layers come from OpenStreetMap for the streets on screen: traffic lights, crossings,
              parks, drinking water, highways, and busy roads. They are mapped objects, not a live
              countdown. If a remaining light sits on a corner you will not wait at, move a waypoint
              and route again. Zoom to streets before you trust overlays. A country-scale view will
              not load lights you can run.
            </p>
            <p>
              Click within about 60 m of the start after two or more points to close a loop. Closing
              on the same arterial you arrived on doubles the signals. Duplicate clicks closer than
              about 2 m are ignored. The cap is 50 stops.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-tight">Quieter route notes</h2>
          <p className="mt-4 text-sm leading-6 text-white/65">
            The public pages are this map and the{" "}
            <Link className="text-[#c8ff52] underline-offset-2 hover:underline" href="/blog">
              quieter route notes
            </Link>
            , including{" "}
            <Link
              className="text-[#c8ff52] underline-offset-2 hover:underline"
              href="/blog/the-complete-guide-to-building-a-run-without-stops"
            >
              the complete guide
            </Link>
            ,{" "}
            <Link
              className="text-[#c8ff52] underline-offset-2 hover:underline"
              href="/blog/how-to-build-low-stop-running-routes-with-run-without-stops"
            >
              how to build a low-stop line
            </Link>
            ,{" "}
            <Link
              className="text-[#c8ff52] underline-offset-2 hover:underline"
              href="/blog/how-to-use-the-run-without-stops-route-builder"
            >
              how to use the Route builder
            </Link>
            ,{" "}
            <Link
              className="text-[#c8ff52] underline-offset-2 hover:underline"
              href="/blog/flat-running-routes-vs-direct-routes-which-is-right-for-your-run"
            >
              flat running routes vs Direct
            </Link>
            , and{" "}
            <Link
              className="text-[#c8ff52] underline-offset-2 hover:underline"
              href="/blog/a-runners-guide-to-traffic-lights-crossings-and-route-intelligence"
            >
              the traffic-lights note
            </Link>
            .
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-tight">FAQs</h2>
          <dl className="mt-4 space-y-5 text-sm leading-6 text-white/65">
            {HOME_FAQS.map((faq) => (
              <div key={faq.question}>
                <dt className="font-medium text-[#f4f7f5]">{faq.question}</dt>
                <dd className="mt-1">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
