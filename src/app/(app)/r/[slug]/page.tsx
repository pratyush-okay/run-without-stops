import { notFound } from "next/navigation";
import { RunningDashboard } from "@/components/dashboard/running-dashboard";
import { env } from "@/env";
import { shareSlugSchema } from "@/lib/schemas/saved-route";
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

  return <RunningDashboard mapboxToken={env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN} sharedRoute={saved} />;
}
