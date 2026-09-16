import { getSavedRouteBySlug } from "@/lib/supabase/saved-routes";
import { GET } from "./route";

vi.mock("@/lib/supabase/saved-routes", () => ({
  getSavedRouteBySlug: vi.fn(),
}));

const saved = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Hyde Park loop",
  shareSlug: "abc12def34",
  sharePath: "/r/abc12def34",
  mode: "low_stops" as const,
  distanceMeters: 1200,
  createdAt: "2026-09-16T00:00:00.000Z",
  updatedAt: "2026-09-16T00:00:00.000Z",
  points: [
    { lat: -33.8688, lng: 151.2093 },
    { lat: -33.87, lng: 151.22 },
  ],
  knownLabels: {},
  route: {
    coordinates: [
      [151.2093, -33.8688],
      [151.22, -33.87],
    ] as [number, number][],
    metrics: {
      distanceMeters: 1200,
      durationSeconds: 360,
      trafficSignals: 1,
      crossings: 2,
      majorRoadMeters: 80,
    },
    provider: "graphhopper" as const,
    warnings: [],
  },
};

describe("GET /api/share/[slug]", () => {
  it("rejects malformed slugs", async () => {
    const response = await GET(new Request("http://localhost/api/share/nope"), {
      params: Promise.resolve({ slug: "NOPE" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns a public saved route", async () => {
    vi.mocked(getSavedRouteBySlug).mockResolvedValue(saved);

    const response = await GET(new Request("http://localhost/api/share/abc12def34"), {
      params: Promise.resolve({ slug: "abc12def34" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      name: "Hyde Park loop",
      shareSlug: "abc12def34",
    });
  });

  it("404s when the share link is unknown", async () => {
    vi.mocked(getSavedRouteBySlug).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/share/abc12def34"), {
      params: Promise.resolve({ slug: "abc12def34" }),
    });

    expect(response.status).toBe(404);
  });
});
