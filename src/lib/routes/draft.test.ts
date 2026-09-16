import { routeDraftKey } from "@/lib/routes/draft";

describe("route draft keys", () => {
  it("changes when the line or mode changes", () => {
    const start = { lat: -33.8688, lng: 151.2093 };
    const finish = { lat: -33.87, lng: 151.22 };

    expect(routeDraftKey([start, finish], "low_stops")).toBe(
      routeDraftKey([start, finish], "low_stops"),
    );
    expect(routeDraftKey([start, finish], "low_stops")).not.toBe(
      routeDraftKey([start, finish], "direct"),
    );
    expect(routeDraftKey([start, finish], "low_stops")).not.toBe(
      routeDraftKey([finish, start], "low_stops"),
    );
  });
});
