const HIGHWAY_CLASSES = ["motorway", "motorway_link", "trunk", "trunk_link"] as const;
const BUSY_ROAD_CLASSES = ["primary", "primary_link", "secondary", "secondary_link"] as const;

export type RoadVisibility = {
  highways: boolean;
  busy_roads: boolean;
};

export function hiddenRoadClasses(visibility: RoadVisibility) {
  return [
    ...(visibility.highways ? [] : HIGHWAY_CLASSES),
    ...(visibility.busy_roads ? [] : BUSY_ROAD_CLASSES),
  ];
}

export function collectFilterClasses(filter: unknown): string[] {
  if (!Array.isArray(filter) || filter.length === 0) return [];
  const op = filter[0];

  if (op === "==" && isClassOperand(filter[1]) && typeof filter[2] === "string") {
    return [filter[2]];
  }

  if (op === "in" && isClassOperand(filter[1]) && !isLiteralOperand(filter[2])) {
    return filter.slice(2).filter((value): value is string => typeof value === "string");
  }

  if (op === "in" && isLiteralOperand(filter[2]) && isClassOperand(filter[1])) {
    const values = filter[2][1];
    if (Array.isArray(values)) {
      return values.filter((value): value is string => typeof value === "string");
    }
  }

  if (op === "match" && isClassOperand(filter[1])) {
    const classes: string[] = [];
    for (let index = 2; index < filter.length - 1; index += 2) {
      const label = filter[index];
      if (typeof label === "string") classes.push(label);
      if (Array.isArray(label)) {
        classes.push(...label.filter((value): value is string => typeof value === "string"));
      }
    }
    return classes;
  }

  if (op === "all" || op === "any" || op === "none" || op === "!") {
    return filter.slice(1).flatMap((part) => collectFilterClasses(part));
  }

  return [];
}

export function toExpressionFilter(filter: unknown): unknown {
  if (filter == null || typeof filter === "boolean") return filter ?? undefined;
  if (!Array.isArray(filter) || filter.length === 0 || typeof filter[0] !== "string") {
    return filter;
  }

  const op = filter[0];
  if (op === "all" || op === "any" || op === "none") {
    return [op, ...filter.slice(1).map((part) => toExpressionFilter(part))];
  }
  if (op === "!" && filter.length === 2) {
    return ["!", toExpressionFilter(filter[1])];
  }

  if (["==", "!=", ">", ">=", "<", "<="].includes(op) && !Array.isArray(filter[1])) {
    return [op, propertyExpression(filter[1]), filter[2]];
  }

  if (op === "in" && typeof filter[1] === "string") {
    return ["in", propertyExpression(filter[1]), ["literal", filter.slice(2)]];
  }
  if (op === "!in" && typeof filter[1] === "string") {
    return ["!", ["in", propertyExpression(filter[1]), ["literal", filter.slice(2)]]];
  }
  if (op === "has" && typeof filter[1] === "string") {
    return ["has", filter[1]];
  }
  if (op === "!has" && typeof filter[1] === "string") {
    return ["!", ["has", filter[1]]];
  }

  return filter;
}

export function filterWithoutRoadClasses(existing: unknown, hidden: string[]) {
  if (hidden.length === 0) return existing ?? undefined;
  const exclusion = ["!", ["in", ["get", "class"], ["literal", hidden]]];
  if (existing == null) return exclusion;
  return ["all", toExpressionFilter(existing), exclusion];
}

export function transportationLayerAction(
  sourceLayer: string | undefined,
  layerId: string,
  filter: unknown,
  hidden: string[],
): "keep" | "hide" | "filter" {
  if (hidden.length === 0) return "keep";
  const isTransportation =
    sourceLayer === "transportation" ||
    sourceLayer === "transportation_name" ||
    sourceLayer === "road" ||
    /(motorway|trunk|primary|secondary)/i.test(layerId);
  if (!isTransportation) return "keep";

  const classes = collectFilterClasses(filter);
  if (classes.length === 0) {
    if (sourceLayer === "road" && !/(motorway|trunk|primary|secondary)/i.test(layerId)) {
      return "keep";
    }
    return "filter";
  }
  if (classes.every((roadClass) => hidden.includes(roadClass))) return "hide";
  if (classes.some((roadClass) => hidden.includes(roadClass))) return "filter";
  return "keep";
}

function isClassOperand(value: unknown) {
  return value === "class" || (Array.isArray(value) && value[0] === "get" && value[1] === "class");
}

function isLiteralOperand(value: unknown): value is ["literal", unknown] {
  return Array.isArray(value) && value[0] === "literal";
}

function propertyExpression(key: unknown) {
  if (key === "$type") return ["geometry-type"];
  if (typeof key === "string") return ["get", key];
  return key;
}
