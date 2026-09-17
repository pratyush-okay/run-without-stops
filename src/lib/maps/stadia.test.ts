import { SYDNEY_CENTER } from "@/lib/geo";
import { nominatimSearchParams, stadiaSearchParams } from "@/lib/maps/stadia";

describe("worldwide place search params", () => {
  it("biases Stadia toward the current map without a Sydney rectangle", () => {
    const worldwide = stadiaSearchParams("Hyde Park", "test-key");
    const local = stadiaSearchParams(
      "Hyde Park",
      "test-key",
      { lat: -33.8688, lng: 151.2093 },
      { localRadiusKm: 50 },
    );

    expect(worldwide.get("text")).toBe("Hyde Park");
    expect(worldwide.get("focus.point.lat")).toBeNull();
    expect(worldwide.get("layers")).toBe("coarse");
    expect(worldwide.get("boundary.circle.radius")).toBeNull();
    expect(local.get("layers")).toBeNull();
    expect(local.get("focus.point.lat")).toBe("-33.8688");
    expect(local.get("boundary.circle.lat")).toBe("-33.8688");
    expect(local.get("boundary.circle.radius")).toBe("50");
  });

  it("keeps a nearby Nominatim search bounded and a worldwide search open", () => {
    const local = nominatimSearchParams("Hyde Park", SYDNEY_CENTER, { bounded: true });
    const worldwide = nominatimSearchParams("Central Park", SYDNEY_CENTER);

    expect(local.get("bounded")).toBe("1");
    expect(local.get("viewbox")).toBe("150.8093,-33.4688,151.6093,-34.2688");
    expect(worldwide.get("bounded")).toBeNull();
    expect(worldwide.get("viewbox")).toBeNull();
    expect(worldwide.get("q")).toBe("Central Park");
  });
});
