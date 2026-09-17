import { summarizeElevation } from "@/lib/routing/elevation";

function line(elevations: number[], stepMeters = 50): Parameters<typeof summarizeElevation>[0] {
  return elevations.map((elevationMeters, index) => ({
    lng: 151.2 + (index * stepMeters) / 111_320,
    lat: -33.87,
    elevationMeters,
  }));
}

describe("elevation summary", () => {
  it("measures climb and descent after smoothing small noise", () => {
    const summary = summarizeElevation(line([10, 10.2, 10.1, 30, 30.4, 12, 11.8]));
    expect(summary?.ascentMeters).toBeGreaterThan(15);
    expect(summary?.descentMeters).toBeGreaterThan(15);
    expect(summary?.minElevationMeters).toBeLessThan(13);
    expect(summary?.maxElevationMeters).toBeGreaterThan(25);
  });

  it("marks where a run starts climbing and then descending", () => {
    const flatThenClimb = Array.from({ length: 8 }, () => 8);
    const climb = Array.from({ length: 8 }, (_, index) => 8 + index * 4);
    const descent = Array.from({ length: 8 }, (_, index) => 40 - index * 4);
    const summary = summarizeElevation(line([...flatThenClimb, ...climb, ...descent]));

    expect(summary?.elevation.marks.some((mark) => mark.kind === "climb")).toBe(true);
    expect(summary?.elevation.marks.some((mark) => mark.kind === "descent")).toBe(true);
    expect(summary?.elevation.samples.length).toBeGreaterThan(8);
    expect(summary?.elevation.samples[0]?.lat).toBeDefined();
    expect(summary?.elevation.samples[0]?.lng).toBeDefined();
  });

  it("does not mark a flat path", () => {
    const summary = summarizeElevation(line(Array.from({ length: 12 }, () => 18)));
    expect(summary?.ascentMeters).toBe(0);
    expect(summary?.descentMeters).toBe(0);
    expect(summary?.elevation.marks).toEqual([]);
  });
});
