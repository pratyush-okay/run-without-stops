import { liftMutedColor } from "@/lib/maps/color";

describe("liftMutedColor", () => {
  it("brightens a dark hex toward a readable gray", () => {
    expect(liftMutedColor("#3a3a3a", 0.38)).toBe("rgb(120 120 120)");
  });

  it("expands three-digit hex values", () => {
    expect(liftMutedColor("#333", 0.38)).toBe("rgb(115 115 115)");
  });

  it("lifts rgb colors and ignores unknown formats", () => {
    expect(liftMutedColor("rgb(40, 48, 44)", 0.5)).toBe("rgb(130 134 132)");
    expect(liftMutedColor("oklch(0.4 0.1 140)", 0.4)).toBeNull();
  });
});
