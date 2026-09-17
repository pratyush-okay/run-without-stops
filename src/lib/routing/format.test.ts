import {
  DEFAULT_PACE_SECONDS_PER_KM,
  displayPaceSeconds,
  durationFromPace,
  formatDistance,
  formatDuration,
  formatEffortDuration,
  formatElevation,
  formatPace,
  paceFromDuration,
  storePaceSeconds,
} from "@/lib/routing/format";

describe("route formatting", () => {
  it("formats short and long distances and durations", () => {
    expect(formatDistance(420)).toBe("420 m");
    expect(formatDistance(710)).toBe("710 m");
    expect(formatDistance(1_240)).toBe("1.24 km");
    expect(formatDistance(4_730, "imperial")).toBe("2.94 mi");
    expect(formatDuration(50)).toBe("1 min");
    expect(formatDuration(600)).toBe("10 min");
    expect(formatDuration(3_700)).toBe("1h 2m");
    expect(formatEffortDuration(durationFromPace(4_730, DEFAULT_PACE_SECONDS_PER_KM))).toBe(
      "26:01",
    );
    expect(formatEffortDuration(3_725)).toBe("1:02:05");
  });

  it("keeps pace and time in sync for a distance", () => {
    expect(formatPace(DEFAULT_PACE_SECONDS_PER_KM)).toBe("5:30");
    expect(Math.round(durationFromPace(4_730, DEFAULT_PACE_SECONDS_PER_KM) / 60)).toBe(26);
    expect(formatPace(paceFromDuration(4_730, 26 * 60))).toBe("5:30");
    expect(formatPace(displayPaceSeconds(DEFAULT_PACE_SECONDS_PER_KM, "imperial"))).toBe("8:51");
    expect(formatPace(storePaceSeconds(8 * 60 + 51, "imperial"))).toBe("5:30");
  });

  it("formats elevation gain in meters or feet", () => {
    expect(formatElevation(48)).toBe("48 m");
    expect(formatElevation(48, "imperial")).toBe("157 ft");
  });
});
