import {
  addRoutePoint,
  closeRouteLoop,
  isRouteLoop,
  removeRoutePoint,
  reverseRoutePoints,
} from "@/lib/routing/points";

const start = { lat: -33.873, lng: 151.21 };
const finish = { lat: -33.868, lng: 151.211 };

describe("route point edits", () => {
  it("adds unique stops and ignores near-duplicates", () => {
    const withStart = addRoutePoint([], start);
    expect(addRoutePoint(withStart, start)).toEqual(withStart);
    expect(addRoutePoint(withStart, finish)).toEqual([start, finish]);
  });

  it("removes, reverses, and closes a loop back to start", () => {
    const points = [start, finish];
    expect(removeRoutePoint(points, 1)).toEqual([start]);
    expect(reverseRoutePoints(points)).toEqual([finish, start]);
    expect(isRouteLoop(points)).toBe(false);
    expect(closeRouteLoop(points)).toEqual([start, finish, start]);
    expect(isRouteLoop(closeRouteLoop(points))).toBe(true);
    expect(closeRouteLoop(closeRouteLoop(points))).toEqual([start, finish, start]);
  });
});
