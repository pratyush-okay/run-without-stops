import { buildGraphHopperRequest, rateLimitDelayMs } from "@/lib/routing/graphhopper";
import type { RouteRequest } from "@/lib/schemas/route";

const baseRequest: RouteRequest = {
  points: [
    { lat: -33.8688, lng: 151.2093 },
    { lat: -33.873, lng: 151.225 },
  ],
  features: [
    {
      id: "node/1",
      kind: "traffic_signal",
      point: { lat: -33.87, lng: 151.215 },
    },
  ],
  mode: "direct",
  avoidElevation: false,
};

describe("GraphHopper custom model", () => {
  it("keeps direct routing simple without signal areas", () => {
    const request = buildGraphHopperRequest(baseRequest);

    expect(request.profile).toBe("foot");
    expect(request.points_encoded).toBe(false);
    expect(request.custom_model.areas.features).toHaveLength(0);
    expect(request.custom_model.distance_influence).toBe(70);
  });

  it("adds soft signal and major-road penalties in low-stops mode", () => {
    const request = buildGraphHopperRequest({ ...baseRequest, mode: "low_stops" });

    expect(request.custom_model.areas.features).toHaveLength(1);
    expect(request.custom_model.distance_influence).toBe(35);
    expect(request.custom_model.priority).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          if: expect.stringContaining("PRIMARY"),
          multiply_by: 0.25,
        }),
        expect.objectContaining({
          if: "in_signal_0",
          multiply_by: 0.25,
        }),
      ]),
    );
  });

  it("penalizes steep slopes when low-stops avoids elevation", () => {
    const request = buildGraphHopperRequest({
      ...baseRequest,
      mode: "low_stops",
      avoidElevation: true,
    });

    expect(request.custom_model.priority).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ if: "max_slope >= 6", multiply_by: 0.45 }),
        expect.objectContaining({ if: "max_slope >= 15", multiply_by: 0.08 }),
      ]),
    );
  });
});

describe("rateLimitDelayMs", () => {
  it("waits long enough for a minutely limit to clear", () => {
    expect(rateLimitDelayMs(0)).toBe(15_000);
    expect(rateLimitDelayMs(2)).toBe(20_000);
  });
});
