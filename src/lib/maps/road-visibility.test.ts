import {
  collectFilterClasses,
  filterWithoutRoadClasses,
  hiddenRoadClasses,
  isManagedRoadLayer,
  roadClassTintExpression,
  toExpressionFilter,
  transportationLayerAction,
} from "@/lib/maps/road-visibility";

const MAJOR_CASING = [
  "all",
  ["==", "$type", "LineString"],
  ["in", "class", "primary", "secondary", "tertiary", "trunk"],
];

const ROAD_SIMPLE_FILTER = [
  "all",
  [
    "step",
    ["zoom"],
    ["match", ["get", "class"], ["motorway", "trunk"], true, false],
    8,
    ["match", ["get", "class"], ["motorway", "trunk", "primary", "secondary"], true, false],
  ],
  ["==", ["geometry-type"], "LineString"],
];

describe("road visibility helpers", () => {
  it("hides motorways and busy roads independently", () => {
    expect(hiddenRoadClasses({ highways: false, busy_roads: true })).toEqual([
      "motorway",
      "motorway_link",
      "trunk",
      "trunk_link",
    ]);
    expect(hiddenRoadClasses({ highways: true, busy_roads: false })).toContain("primary");
  });

  it("filters Mapbox secondary-tertiary layers instead of hiding tertiary streets", () => {
    expect(
      transportationLayerAction(
        "road",
        "road-secondary-tertiary",
        ["match", ["get", "class"], ["secondary", "tertiary"], true, false],
        ["primary", "secondary", "primary_link", "secondary_link"],
      ),
    ).toBe("filter");
    expect(
      transportationLayerAction(
        "road",
        "road-path",
        ["==", ["get", "class"], "path"],
        ["motorway", "primary"],
      ),
    ).toBe("keep");
  });

  it("filters Dark v11 road-simple instead of leaving motorways visible", () => {
    expect(
      transportationLayerAction("road", "road-simple", ROAD_SIMPLE_FILTER, [
        "motorway",
        "motorway_link",
        "trunk",
        "trunk_link",
      ]),
    ).toBe("filter");
    expect(collectFilterClasses(ROAD_SIMPLE_FILTER)).toEqual(
      expect.arrayContaining(["motorway", "primary", "secondary"]),
    );
  });

  it("hides a motorway-only layer when highways are off", () => {
    expect(
      transportationLayerAction(
        "transportation",
        "road_motorway",
        ["==", "class", "motorway"],
        ["motorway", "trunk"],
      ),
    ).toBe("hide");
  });

  it("does not treat path or rail overlays as managed roads", () => {
    expect(isManagedRoadLayer("road", "road-path")).toBe(false);
    expect(isManagedRoadLayer("road", "road-simple")).toBe(true);
    expect(isManagedRoadLayer("road", "bridge-simple")).toBe(true);
  });

  it("tints highway and busy-road classes independently", () => {
    expect(
      roadClassTintExpression("#444", { highways: true, busy_roads: false }, "#ff5a2a", "#f0b429"),
    ).toEqual([
      "case",
      ["in", ["get", "class"], ["literal", ["motorway", "motorway_link", "trunk", "trunk_link"]]],
      "#ff5a2a",
      "#444",
    ]);
  });

  it("converts legacy class filters into MapLibre expressions", () => {
    expect(
      toExpressionFilter(["in", "class", "primary", "secondary", "tertiary", "trunk"]),
    ).toEqual(["in", ["get", "class"], ["literal", ["primary", "secondary", "tertiary", "trunk"]]]);
    expect(toExpressionFilter(["==", "$type", "LineString"])).toEqual([
      "==",
      ["geometry-type"],
      "LineString",
    ]);
  });

  it("filters mixed road layers without nesting legacy in operators", () => {
    expect(transportationLayerAction("transportation", "road", undefined, ["motorway"])).toBe(
      "filter",
    );
    expect(filterWithoutRoadClasses(["==", "class", "path"], ["motorway"])).toEqual([
      "all",
      ["==", ["get", "class"], "path"],
      ["!", ["in", ["get", "class"], ["literal", ["motorway"]]]],
    ]);
    expect(
      filterWithoutRoadClasses(MAJOR_CASING, [
        "motorway",
        "trunk",
        "primary",
        "secondary",
        "primary_link",
        "secondary_link",
      ]),
    ).toEqual([
      "all",
      [
        "all",
        ["==", ["geometry-type"], "LineString"],
        ["in", ["get", "class"], ["literal", ["primary", "secondary", "tertiary", "trunk"]]],
      ],
      [
        "!",
        [
          "in",
          ["get", "class"],
          [
            "literal",
            ["motorway", "trunk", "primary", "secondary", "primary_link", "secondary_link"],
          ],
        ],
      ],
    ]);
  });
});
