import { notFound } from "next/navigation";
import { RunningDashboard } from "@/components/dashboard/running-dashboard";
import { env } from "@/env";
import { shareSlugSchema } from "@/lib/schemas/saved-route";
import { getSavedRouteBySlug } from "@/lib/supabase/saved-routes";

function mapStyleUrl() {
  const key = env.NEXT_PUBLIC_STADIA_MAPS_API_KEY;
  return key
    ? `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${encodeURIComponent(key)}`
    : "osm-demo";
}

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

  return <RunningDashboard mapStyleUrl={mapStyleUrl()} sharedRoute={saved} />;
}
