import { routeToGpx } from "@/lib/routing/gpx";

describe("GPX export", () => {
  it("writes track points as lat/lon", () => {
    const gpx = routeToGpx(
      [
        [151.2115, -33.8682],
        [151.2127, -33.8734],
      ],
      "Hyde Park loop",
    );

    expect(gpx).toContain(`<name>Hyde Park loop</name>`);
    expect(gpx).toContain(`<trkpt lat="-33.868200" lon="151.211500"></trkpt>`);
    expect(gpx).toContain(`<trkpt lat="-33.873400" lon="151.212700"></trkpt>`);
  });
});
