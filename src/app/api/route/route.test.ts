import { fetchBestRoute } from "@/lib/routing";
import { POST } from "./route";

vi.mock("@/lib/routing", () => ({
  fetchBestRoute: vi.fn(),
}));

describe("POST /api/route", () => {
  it("rejects requests without two route points", async () => {
    const response = await POST(
      new Request("http://localhost/api/route", {
        method: "POST",
        body: JSON.stringify({ points: [] }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Add at least a start and finish point",
    });
  });

  it("returns a provider-neutral route response", async () => {
    vi.mocked(fetchBestRoute).mockResolvedValue({
      coordinates: [
        [151.2093, -33.8688],
        [151.22, -33.87],
      ],
      metrics: {
        distanceMeters: 1200,
        durationSeconds: 360,
        trafficSignals: 1,
        crossings: 2,
        majorRoadMeters: 80,
      },
      provider: "graphhopper",
      warnings: [],
    });

    const response = await POST(
      new Request("http://localhost/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: [
            { lat: -33.8688, lng: 151.2093 },
            { lat: -33.87, lng: 151.22 },
          ],
          mode: "low_stops",
          features: [],
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      provider: "graphhopper",
      metrics: { trafficSignals: 1, crossings: 2 },
    });
  });
});
