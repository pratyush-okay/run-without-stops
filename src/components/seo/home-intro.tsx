import Link from "next/link";
import { BrandMark } from "@/components/brand/app-logo";

export function HomeIntro() {
  return (
    <section
      aria-label="About Run Without Stops"
      className="pointer-events-none absolute z-20 left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] bottom-[calc(var(--rws-chrome-clearance)+env(safe-area-inset-bottom))]"
    >
      <details className="rws-intro group pointer-events-none relative ml-auto w-full max-w-sm">
        <summary className="rws-panel pointer-events-auto ml-auto flex size-9 cursor-pointer list-none items-center justify-center text-[#c8ff52] transition hover:text-[#d6ff7a] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#c8ff52] [&::-webkit-details-marker]:hidden">
          <span className="sr-only">About this planner</span>
          <BrandMark className="size-5" />
        </summary>
        <div className="pointer-events-auto absolute right-0 bottom-[calc(100%+0.5rem)] hidden w-full group-open:block">
          <div className="rws-panel max-h-[min(60dvh,24rem)] overflow-auto overflow-x-hidden p-3 text-left break-words md:p-4">
            <p className="rws-kicker break-words">Run Without Stops | Run Planner</p>
            <h1 className="mt-1 text-base font-semibold tracking-tight">
              Plan quieter running routes
            </h1>
            <p className="mt-2 text-xs leading-5 text-white/70">
              Run Without Stops is a free map-first planner. Click the map, search a place anywhere,
              or start from where you are. Low-stop routing can skip traffic lights, highways, and
              busy roads. Turn on parks, crossings, and drinking water, or flatten hills with Avoid
              hills. Sign in only if you want to save a line or share it as a link.
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
              ,{" "}
              <Link
                className="text-[#c8ff52] underline-offset-2 hover:underline"
                href="/blog/how-to-build-low-stop-running-routes-with-run-without-stops"
              >
                how to build a low-stop line
              </Link>
              , or{" "}
              <Link
                className="text-[#c8ff52] underline-offset-2 hover:underline"
                href="/blog/how-to-use-the-run-without-stops-route-builder"
              >
                how to use the Route builder
              </Link>
              . Terms and credits for the map, routing, and sign-in services sit on the{" "}
              <Link className="text-[#c8ff52] underline-offset-2 hover:underline" href="/terms">
                terms
              </Link>{" "}
              page.
            </p>
            <p className="mt-2 text-xs leading-5 text-white/70">
              Street data is{" "}
              <a
                className="text-[#c8ff52] underline-offset-2 hover:underline"
                href="https://www.openstreetmap.org/copyright"
                rel="noopener"
              >
                OpenStreetMap
              </a>
              . Routing uses{" "}
              <a
                className="text-[#c8ff52] underline-offset-2 hover:underline"
                href="https://www.graphhopper.com"
                rel="noopener"
              >
                GraphHopper
              </a>{" "}
              and{" "}
              <a
                className="text-[#c8ff52] underline-offset-2 hover:underline"
                href="https://valhalla.github.io/valhalla"
                rel="noopener"
              >
                Valhalla
              </a>
              .
            </p>
          </div>
        </div>
      </details>
    </section>
  );
}
