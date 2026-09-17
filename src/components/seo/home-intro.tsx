import Link from "next/link";

export function HomeIntro() {
  return (
    <section className="pointer-events-none absolute z-20 max-md:sr-only md:right-4 md:bottom-[calc(var(--rws-metrics-clearance)+0.75rem)] md:max-w-sm">
      <div className="rws-panel pointer-events-auto p-4">
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
            route planning guide
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
