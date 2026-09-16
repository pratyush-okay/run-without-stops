import { suggestedRouteName } from "@/lib/routes/name";

describe("suggested route names", () => {
  it("uses start and finish places", () => {
    expect(
      suggestedRouteName({
        startLabel: "Hyde Park, Sydney",
        finishLabel: "Circular Quay, Sydney",
      }),
    ).toBe("Hyde Park to Circular Quay");
  });

  it("names a loop from the start place", () => {
    expect(
      suggestedRouteName({
        startLabel: "Centennial Park",
        finishLabel: "Centennial Park",
        isLoop: true,
      }),
    ).toBe("Centennial Park loop");
  });

  it("falls back when places are unknown", () => {
    expect(suggestedRouteName({ startLabel: "Pinned place" })).toBe("Sydney run");
  });
});
