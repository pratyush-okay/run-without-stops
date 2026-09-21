import { env } from "@/env";

let started = false;

export function warmRoutingConnection() {
  if (started || !env.GRAPHHOPPER_API_KEY) return;
  started = true;
  void fetch(
    `${env.GRAPHHOPPER_API_URL}/route?key=${encodeURIComponent(env.GRAPHHOPPER_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        points: [
          [151.2093, -33.8688],
          [151.2102, -33.8689],
        ],
        profile: "foot",
        points_encoded: true,
        instructions: false,
        elevation: false,
      }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    },
  ).catch(() => undefined);
}
