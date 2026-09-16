import { RunningDashboard } from "@/components/dashboard/running-dashboard";
import { env } from "@/env";

export default function Home() {
  return <RunningDashboard mapboxToken={env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN} />;
}
