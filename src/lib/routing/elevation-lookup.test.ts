import { fetchHeightsAlongRoute, HEIGHT_LOOKUP_BUDGET_MS } from "@/lib/routing/elevation-lookup";

const line: [number, number][] = [
  [151.2, -33.86],
  [151.21, -33.87],
];

describe("fetchHeightsAlongRoute", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("keeps elevation when the height service answers quickly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ height: [10, 12] })),
    );

    await expect(fetchHeightsAlongRoute(line)).resolves.toEqual([
      { lng: 151.2, lat: -33.86, elevationMeters: 10 },
      { lng: 151.21, lat: -33.87, elevationMeters: 12 },
    ]);
  });

  it("returns the line without waiting on a stalled height service", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );

    const pending = fetchHeightsAlongRoute(line);
    await vi.advanceTimersByTimeAsync(HEIGHT_LOOKUP_BUDGET_MS);

    await expect(pending).resolves.toBeUndefined();
  });
});
