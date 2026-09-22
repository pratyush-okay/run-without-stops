import { currentUser } from "@clerk/nextjs/server";
import {
  MAX_SAVED_ROUTE_COORDINATES,
  type SavedRoute,
  type SavedRouteSummary,
} from "@/lib/schemas/saved-route";
import { createSavedRoute, listSavedRoutes } from "@/lib/supabase/saved-routes";
import { GET, POST } from "./route";

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/lib/supabase/profiles", () => ({
  upsertProfile: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/supabase/saved-routes", () => ({
  listSavedRoutes: vi.fn(),
  createSavedRoute: vi.fn(),
}));

const routeBody = {
  name: "Hyde Park loop",
  points: [
    { lat: -33.8688, lng: 151.2093 },
    { lat: -33.87, lng: 151.22 },
  ],
  knownLabels: {} as Record<string, string>,
  mode: "low_stops" as const,
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

const saved: SavedRoute = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Hyde Park loop",
  shareSlug: "abc12def34",
  sharePath: "/r/abc12def34",
  mode: "low_stops",
  distanceMeters: 1200,
  trafficSignals: 1,
  crossings: 2,
  majorRoadMeters: 80,
  createdAt: "2026-09-16T00:00:00.000Z",
  updatedAt: "2026-09-16T00:00:00.000Z",
  points: routeBody.points,
  knownLabels: {},
  route: routeBody.route,
};

const summary: SavedRouteSummary = {
  id: saved.id,
  name: saved.name,
  shareSlug: saved.shareSlug,
  sharePath: saved.sharePath,
  mode: saved.mode,
  distanceMeters: saved.distanceMeters,
  trafficSignals: saved.trafficSignals,
  crossings: saved.crossings,
  majorRoadMeters: saved.majorRoadMeters,
  createdAt: saved.createdAt,
  updatedAt: saved.updatedAt,
};

describe("GET /api/routes", () => {
  it("rejects signed-out requests", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("lists the current user's routes", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_123" } as never);
    vi.mocked(listSavedRoutes).mockResolvedValue([summary]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ routes: [summary] });
  });
});

describe("POST /api/routes", () => {
  it("requires an account before saving", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/routes", {
        method: "POST",
        body: JSON.stringify(routeBody),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Sign in to save a route" });
  });

  it("saves a named route for a signed-in user", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user_123",
      username: "loop_runner",
      firstName: "Ada",
      lastName: null,
      primaryEmailAddress: { emailAddress: "ada@example.com" },
      emailAddresses: [{ emailAddress: "ada@example.com" }],
      unsafeMetadata: {},
    } as never);
    vi.mocked(createSavedRoute).mockResolvedValue(saved);

    const response = await POST(
      new Request("http://localhost/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routeBody),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      name: "Hyde Park loop",
      sharePath: "/r/abc12def34",
    });
  });

  it("rejects oversized route geometry", async () => {
    vi.mocked(createSavedRoute).mockClear();
    vi.mocked(currentUser).mockResolvedValue({
      id: "user_123",
      username: "loop_runner",
      firstName: "Ada",
      lastName: null,
      primaryEmailAddress: { emailAddress: "ada@example.com" },
      emailAddresses: [{ emailAddress: "ada@example.com" }],
      unsafeMetadata: {},
    } as never);

    const response = await POST(
      new Request("http://localhost/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...routeBody,
          route: {
            ...routeBody.route,
            coordinates: Array.from({ length: MAX_SAVED_ROUTE_COORDINATES + 1 }, (_, index) => [
              151.2,
              -33.86 - index / 1e6,
            ]),
          },
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(createSavedRoute).not.toHaveBeenCalled();
  });
});
