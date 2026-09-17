import Link from "next/link";
import { notFound } from "next/navigation";
import { RunningDashboard } from "@/components/dashboard/running-dashboard";
import { env } from "@/env";
import { shareSlugSchema } from "@/lib/schemas/saved-route";
import { requestIsSearchCrawler } from "@/lib/seo/request-crawler";
import { getSavedRouteBySlug } from "@/lib/supabase/saved-routes";

export async function generateMetadata({ params }: PageProps<"/r/[slug]">) {
  const { slug } = await params;
  const parsed = shareSlugSchema.safeParse(slug);
  const saved = parsed.success ? await getSavedRouteBySlug(parsed.data) : null;
  if (!saved) {
    return { title: "Shared route · Run Without Stops" };
  }
  return {
    title: `${saved.name} · Run Without Stops`,
    description: "Open this running route in Run Without Stops.",
  };
}

export default async function SharedRoutePage({ params }: PageProps<"/r/[slug]">) {
  const { slug } = await params;
  const parsed = shareSlugSchema.safeParse(slug);
  if (!parsed.success) notFound();

  const saved = await getSavedRouteBySlug(parsed.data);
  if (!saved) notFound();

  if (await requestIsSearchCrawler()) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#0a0d0b] px-4 text-white">
        <section className="rws-panel w-full max-w-md p-5">
          <h1 className="text-lg font-semibold tracking-tight">{saved.name}</h1>
          <p className="mt-2 text-xs text-white/55">
            Open this running route in Run Without Stops.
          </p>
          <p className="mt-3 text-sm">
            <Link className="text-[#c8ff52] underline-offset-2 hover:underline" href="/">
              Map
            </Link>
          </p>
        </section>
      </main>
    );
  }

  return <RunningDashboard mapboxToken={env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN} sharedRoute={saved} />;
}
