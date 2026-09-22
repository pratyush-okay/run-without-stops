import { mapWithConcurrency } from "@/lib/routing/map-pool";

describe("mapWithConcurrency", () => {
  it("keeps at most the requested number of workers in flight", async () => {
    let active = 0;
    let peak = 0;

    await mapWithConcurrency(
      Array.from({ length: 6 }, (_, index) => index),
      2,
      async (item) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 15));
        active -= 1;
        return item;
      },
    );

    expect(peak).toBe(2);
  });
});
