import { combinedIconId, pairWaypointFeatures } from "@/lib/maps/combined-markers";
import type { WaypointMark } from "@/lib/routing/waypoints";
import type { RunnerFeature } from "@/lib/schemas/features";

const via: WaypointMark = {
  index: 1,
  point: { lat: -33.87, lng: 151.21 },
  role: "via",
  label: "2",
  title: "Stop 2",
};

const start: WaypointMark = {
  index: 0,
  point: { lat: -33.871, lng: 151.208 },
  role: "start",
  label: "",
  title: "Start",
};

const signal: RunnerFeature = {
  id: "light",
  kind: "traffic_signal",
  point: { lat: -33.87005, lng: 151.21004 },
};

const crossing: RunnerFeature = {
  id: "zebra",
  kind: "crossing",
  point: { lat: -33.87004, lng: 151.21003 },
};

const water: RunnerFeature = {
  id: "tap",
  kind: "drinking_water",
  point: { lat: -33.87, lng: 151.21 },
};

const farSignal: RunnerFeature = {
  id: "far",
  kind: "traffic_signal",
  point: { lat: -33.88, lng: 151.22 },
};

describe("combined checkpoint pills", () => {
  it("merges a corner via with the nearest light and leaves water alone", () => {
    const { combined, leftoverFeatures } = pairWaypointFeatures(
      [start, via],
      [signal, water, farSignal],
    );

    expect(combined).toEqual([
      {
        waypoint: via,
        feature: signal,
      },
    ]);
    expect(leftoverFeatures.map((feature) => feature.id)).toEqual(["tap", "far"]);
  });

  it("prefers a traffic light over a zebra at the same corner", () => {
    const { combined, leftoverFeatures } = pairWaypointFeatures([via], [crossing, signal]);

    expect(combined[0]?.feature?.id).toBe("light");
    expect(leftoverFeatures.map((feature) => feature.id)).toEqual(["zebra"]);
  });

  it("names combined icons by waypoint role and feature kind", () => {
    expect(combinedIconId("via", "traffic_signal")).toBe("runner-combined-via-traffic_signal");
    expect(combinedIconId("start_finish")).toBe("runner-combined-start_finish");
    expect(combinedIconId("start_finish", "crossing")).toBe(
      "runner-combined-start_finish-crossing",
    );
  });

  it("puts loop start and finish on one pill even without a light", () => {
    const startFinish: WaypointMark = {
      index: 0,
      point: start.point,
      role: "start_finish",
      label: "",
      title: "Start / finish",
    };

    const { combined, leftoverFeatures } = pairWaypointFeatures([startFinish, via], [farSignal]);

    expect(combined).toEqual([{ waypoint: startFinish }]);
    expect(leftoverFeatures.map((feature) => feature.id)).toEqual(["far"]);
  });

  it("does not merge start or finish with a light or zebra", () => {
    const startFinish: WaypointMark = {
      index: 0,
      point: via.point,
      role: "start_finish",
      label: "",
      title: "Start / finish",
    };
    const finish: WaypointMark = {
      index: 2,
      point: via.point,
      role: "finish",
      label: "",
      title: "Finish",
    };

    expect(pairWaypointFeatures([startFinish], [signal, crossing])).toEqual({
      combined: [{ waypoint: startFinish }],
      leftoverFeatures: [signal, crossing],
    });
    expect(pairWaypointFeatures([start], [signal])).toEqual({
      combined: [],
      leftoverFeatures: [signal],
    });
    expect(pairWaypointFeatures([finish], [crossing])).toEqual({
      combined: [],
      leftoverFeatures: [crossing],
    });
  });
});
