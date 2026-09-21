import { currentUser } from "@clerk/nextjs/server";
import { canUseAgentChat } from "@/lib/agent/admin";
import { POST } from "./route";

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/lib/agent/admin", () => ({
  canUseAgentChat: vi.fn(),
}));

vi.mock("@/lib/osm/scenic", () => ({
  findScenicPlaces: vi.fn(async () => [
    {
      id: "park/1",
      kind: "park",
      name: "Hyde Park",
      point: { lat: -33.8731, lng: 151.2113 },
    },
  ]),
}));

vi.mock("@/lib/osm/walkable", () => ({
  snapLoopPoints: vi.fn(async (points: unknown) => points),
}));

vi.mock("@/lib/routing", () => ({
  fetchBestRoute: vi.fn(async () => ({
    coordinates: [
      [151.2093, -33.8688],
      [151.215, -33.873],
      [151.2093, -33.8688],
    ],
    metrics: {
      distanceMeters: 6_000,
      durationSeconds: 1_980,
      trafficSignals: 0,
      crossings: 0,
      majorRoadMeters: 0,
    },
    provider: "graphhopper",
    warnings: [],
  })),
}));

function planRequest(body: unknown) {
  return new Request("http://localhost/api/agent/plan-run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/agent/plan-run", () => {
  it("rejects signed-out requests", async () => {
    vi.mocked(currentUser).mockResolvedValue(null);

    const response = await POST(planRequest({ text: "Make a 6k loop around me" }));

    expect(response.status).toBe(401);
  });

  it("builds a 6k park loop from the user text", async () => {
    vi.mocked(currentUser).mockResolvedValue({ id: "user_123" } as never);
    vi.mocked(canUseAgentChat).mockReturnValue(true);

    const response = await POST(
      planRequest({
        text: "Make a 6k loop around me\nI want to include a park as well",
        context: { mapCenter: { lat: -33.8688, lng: 151.2093 }, unit: "metric" },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.targetMeters).toBe(6_000);
    expect(body.summary).toMatch(/Hyde Park/);
    expect(body.points[0]).toEqual({ lat: -33.8688, lng: 151.2093 });
  });
});
