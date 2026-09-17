import Link from "next/link";

export function HomeDetails() {
  return (
    <section className="border-t border-white/10 bg-[#0a0d0b] px-4 py-10 text-[#f4f7f5]">
      <div className="mx-auto max-w-3xl">
        <p className="rws-kicker">How it works</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          Draw a run, then pull it off the waits
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-white/65">
          <p>
            The map above is the product. Click a start, add a finish, or search a suburb. Low-stop
            routing prefers streets with fewer traffic lights and tries to keep off highways and
            busy roads when a quieter legal line exists. Direct mode draws the more literal
            pedestrian path. Avoid elevation is a separate switch for hills.
          </p>
          <p>
            Layers come from OpenStreetMap for the streets on screen: traffic lights, crossings,
            parks, drinking water, highways, and busy roads. They are mapped objects, not a live
            countdown. If a remaining light sits on a corner you will not wait at, move a waypoint
            and route again.
          </p>
          <p>
            You can export GPX or an image without an account. Sign in only to save a named line or
            share a private <code className="text-white/80">/r/</code> link. Those share URLs stay
            out of search. The public pages are this map and the{" "}
            <Link className="text-[#c8ff52] underline-offset-2 hover:underline" href="/blog">
              quieter route notes
            </Link>
            , including{" "}
            <Link
              className="text-[#c8ff52] underline-offset-2 hover:underline"
              href="/blog/the-complete-guide-to-building-a-run-without-stops"
            >
              the complete guide
            </Link>{" "}
            and{" "}
            <Link
              className="text-[#c8ff52] underline-offset-2 hover:underline"
              href="/blog/a-runners-guide-to-traffic-lights-crossings-and-route-intelligence"
            >
              the traffic-lights note
            </Link>
            .
          </p>
          <p>
            Search any city, zoom to the streets you actually run, or start from where you are. The
            map still opens on Sydney if the browser has no location yet. Routing and overlays load
            for the viewport, not for a whole country at once, so a quiet line in Melbourne, London,
            or a suburb you just moved to is the same click as a loop around the park you already
            know.
          </p>
        </div>
      </div>
    </section>
  );
}
