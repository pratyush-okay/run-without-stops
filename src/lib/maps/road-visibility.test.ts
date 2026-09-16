import {
  filterWithoutRoadClasses,
  hiddenRoadClasses,
  toExpressionFilter,
  transportationLayerAction,
} from "@/lib/maps/road-visibility";

const MAJOR_CASING = [
  "all",
  ["==", "$type", "LineString"],
  ["in", "class", "primary", "secondary", "tertiary", "trunk"],
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
