import { routeToSvg, simplifyCoordinates } from "@/lib/routing/graphic";

describe("route SVG export", () => {
  it("draws a transparent story overlay with the route name", () => {
    const svg = routeToSvg({
      coordinates: [
        [151.2115, -33.8682],
        [151.2127, -33.8734],
        [151.21, -33.871],
      ],
      name: "Hyde Park loop",
      subtitle: "4.2 km",
    });

    expect(svg).toContain("<polyline");
    expect(svg).toContain("Hyde Park loop");
    expect(svg).toContain("4.2 km");
    expect(svg).not.toContain("<rect");
  });

  it("can add a dark background for image exports", () => {
    const svg = routeToSvg({
      coordinates: [
        [151.2115, -33.8682],
        [151.2127, -33.8734],
      ],
      name: "Night run",
      background: "#0a0d0b",
    });

    expect(svg).toContain(`<rect width="100%" height="100%" fill="#0a0d0b"/>`);
  });

  it("downsamples long polylines for overlay exports", () => {
    const coordinates = Array.from(
      { length: 1200 },
      (_, index) => [151.2 + index / 10_000, -33.86] as [number, number],
    );
    expect(simplifyCoordinates(coordinates)).toHaveLength(360);
  });
});
