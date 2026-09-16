import { RunningDashboard } from "@/components/dashboard/running-dashboard";
import { env } from "@/env";

export default function Home() {
  const key = env.NEXT_PUBLIC_STADIA_MAPS_API_KEY;
  const mapStyleUrl = key
    ? `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${encodeURIComponent(key)}`
    : "osm-demo";

  return <RunningDashboard mapStyleUrl={mapStyleUrl} />;
}
