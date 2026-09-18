import Link from "next/link";
import { BrandMark } from "@/components/brand/app-logo";

export function HomeIntro() {
  return (
    <section
      aria-label="About Run Without Stops"
      className="pointer-events-none absolute z-20 right-[max(0.75rem,env(safe-area-inset-right))] bottom-[calc(var(--rws-metrics-clearance)+env(safe-area-inset-bottom))] md:max-w-sm"
    >
      <details className="group pointer-events-auto flex max-h-[min(70dvh,28rem)] flex-col-reverse items-end">
        <summary className="rws-panel mt-2 flex size-9 cursor-pointer list-none items-center justify-center text-[#c8ff52] transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#c8ff52] [&::-webkit-details-marker]:hidden md:h-auto md:w-auto md:gap-2 md:px-3 md:py-2 md:text-xs md:font-medium md:text-white/80 md:hover:text-white">
          <span className="sr-only md:hidden">About this planner</span>
          <span className="hidden md:inline md:group-open:hidden">About this planner</span>
          <span className="hidden md:group-open:inline">Hide planner intro</span>
          <BrandMark className="size-5 md:size-4" />
        </summary>
        <div className="rws-panel w-[min(24rem,calc(100vw-1.5rem))] overflow-auto p-3 md:p-4">
          <p className="rws-kicker">Anywhere</p>
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
            .
          </p>
        </div>
      </details>
    </section>
  );
}
