import {
  addRoutePoint,
  closeRouteLoop,
  isRouteLoop,
  moveRoutePoint,
  removeRoutePoint,
  reverseRoutePoints,
} from "@/lib/routing/points";
import { linePreviewCoordinates, visibleWaypoints } from "@/lib/routing/waypoints";

const start = { lat: -33.873, lng: 151.21 };
const finish = { lat: -33.868, lng: 151.211 };
const via = { lat: -33.87, lng: 151.215 };

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

  it("closes a loop even when the unique stop cap is full", () => {
    const filled = [start, via, finish, { lat: -33.872, lng: 151.218 }];
    expect(closeRouteLoop(filled, 4)).toEqual([...filled, start]);
  });

  it("keeps loop closure when adding or moving stops", () => {
    const looped = closeRouteLoop([start, via, finish]);
    expect(addRoutePoint(looped, { lat: -33.869, lng: 151.213 })).toEqual([
      start,
      via,
      finish,
      { lat: -33.869, lng: 151.213 },
      start,
    ]);
    expect(moveRoutePoint(looped, 0, { lat: -33.874, lng: 151.209 })).toEqual([
      { lat: -33.874, lng: 151.209 },
      via,
      finish,
      { lat: -33.874, lng: 151.209 },
    ]);
  });

  it("deleting the start/stop pin unwraps the loop", () => {
    const looped = closeRouteLoop([start, via, finish]);
    expect(removeRoutePoint(looped, 0)).toEqual([via, finish]);
    expect(removeRoutePoint(looped, 3)).toEqual([start, via, finish]);
  });
});

describe("visible waypoints", () => {
  it("marks an open route as start and finish instead of 1 and N", () => {
    expect(visibleWaypoints([start, via, finish]).map((mark) => [mark.role, mark.label])).toEqual([
      ["start", ""],
      ["via", "2"],
      ["finish", ""],
    ]);
  });

  it("shows one start/stop pin on a loop instead of stacking the last number", () => {
    const marks = visibleWaypoints(closeRouteLoop([start, via, finish]));
    expect(marks.map((mark) => [mark.label, mark.role, mark.index])).toEqual([
      ["", "start_finish", 0],
      ["2", "via", 1],
      ["3", "via", 2],
    ]);
  });

  it("builds a straight preview line from the pins", () => {
    expect(linePreviewCoordinates([start, finish])).toEqual([
      [start.lng, start.lat],
      [finish.lng, finish.lat],
    ]);
  });
});
