import { shortPlaceLabel } from "@/lib/maps/place-label";

describe("place labels", () => {
  it("keeps the first useful part of a geocoded address", () => {
    expect(shortPlaceLabel("Hyde Park, Sydney, New South Wales, 2000, Australia")).toBe(
      "Hyde Park",
    );
    expect(shortPlaceLabel("")).toBe("Pinned place");
  });
});
