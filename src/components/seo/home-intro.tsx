import Link from "next/link";

export function HomeIntro() {
  return (
    <section className="pointer-events-none absolute z-20 inset-x-[max(0.75rem,env(safe-area-inset-left))] top-[calc(env(safe-area-inset-top)+4.75rem)] right-[max(0.75rem,env(safe-area-inset-right))] md:inset-auto md:right-4 md:top-auto md:bottom-[calc(var(--rws-metrics-clearance)+0.75rem)] md:max-w-sm">
      <div className="rws-panel pointer-events-auto p-3 md:p-4">
        <p className="rws-kicker">Anywhere</p>
        <h1 className="mt-1 text-base font-semibold tracking-tight">Plan quieter running routes</h1>
        <p className="mt-2 text-xs leading-5 text-white/70">
          Run Without Stops is a free map-first planner. Click the map, search a place anywhere, or
          start from where you are. Low-stop routing can skip traffic lights, highways, and busy
          roads. Turn on parks, crossings, and drinking water, or flatten hills with avoid
          elevation. Sign in only if you want to save a line or share it as a link.
        </p>
        <p className="mt-2 text-xs leading-5 text-white/70">
          Read the{" "}
          <Link className="text-[#c8ff52] underline-offset-2 hover:underline" href="/blog">
            quieter route notes
          </Link>
          , the{" "}
          <Link
            className="text-[#c8ff52] underline-offset-2 hover:underline"
            href="/blog/the-complete-guide-to-building-a-run-without-stops"
          >
            complete guide to building a run without stops
          </Link>
          , then the{" "}
          <Link
            className="text-[#c8ff52] underline-offset-2 hover:underline"
            href="/blog/a-runners-guide-to-traffic-lights-crossings-and-route-intelligence"
          >
            traffic lights and crossings note
          </Link>
          , or{" "}
          <Link
            className="text-[#c8ff52] underline-offset-2 hover:underline"
            href="/blog/how-to-build-low-stop-running-routes-with-run-without-stops"
          >
            how to build a low-stop line
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
