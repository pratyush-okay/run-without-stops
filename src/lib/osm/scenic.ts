import { overpassPoint, queryOverpass } from "@/lib/osm/overpass";
import type { GeoPoint } from "@/lib/schemas/features";

export type ScenicPlace = {
  id: string;
  kind: "park" | "lake" | "water";
  name: string;
  point: GeoPoint;
};

function classify(tags: Record<string, string>): ScenicPlace["kind"] | undefined {
  if (tags.amenity === "drinking_water") return "water";
  if (tags.leisure === "park" || tags.leisure === "nature_reserve" || tags.leisure === "garden") {
    return "park";
  }
  if (
    tags.natural === "water" ||
    tags.natural === "lake" ||
    tags.water === "lake" ||
    tags.water === "reservoir" ||
    tags.water === "pond"
  ) {
    return "lake";
  }
  return undefined;
}

function scenicQuery(origin: GeoPoint, radiusMeters: number) {
  const around = `around:${Math.round(radiusMeters)},${origin.lat},${origin.lng}`;
  return `[out:json][timeout:15][maxsize:16777216];
(
  nwr["leisure"="park"](${around});
  nwr["leisure"="nature_reserve"](${around});
  nwr["natural"="water"](${around});
  nwr["water"="lake"](${around});
  nwr["water"="reservoir"](${around});
  nwr["amenity"="drinking_water"](${around});
);
out center tags;`;
}

export async function findScenicPlaces(
  origin: GeoPoint,
  radiusMeters: number,
): Promise<ScenicPlace[]> {
  const query = scenicQuery(origin, Math.min(8_000, Math.max(400, radiusMeters)));
  const places: ScenicPlace[] = [];
  for (const element of await queryOverpass(query)) {
    const point = overpassPoint(element);
    if (!point) continue;
    const kind = classify(element.tags ?? {});
    if (!kind) continue;
    places.push({
      id: `${element.type}/${element.id}`,
      kind,
      name:
        element.tags?.name ??
        (kind === "water" ? "Drinking water" : kind === "lake" ? "Lake" : "Park"),
      point,
    });
  }
  const unique = [...new Map(places.map((place) => [place.id, place])).values()];
  return [
    ...unique.filter((place) => place.kind === "park").slice(0, 12),
    ...unique.filter((place) => place.kind === "lake").slice(0, 8),
    ...unique.filter((place) => place.kind === "water").slice(0, 12),
  ];
}
