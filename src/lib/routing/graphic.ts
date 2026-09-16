export const STORY_GRAPHIC_SIZE = { width: 1080, height: 1920 } as const;
export const CARD_GRAPHIC_SIZE = { width: 1200, height: 630 } as const;

export type RouteGraphicOptions = {
  coordinates: [number, number][];
  name: string;
  subtitle?: string | undefined;
  background?: string | null;
  width?: number;
  height?: number;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function simplifyCoordinates(coordinates: [number, number][], maxPoints = 360) {
  if (coordinates.length <= maxPoints) return coordinates;
  const step = (coordinates.length - 1) / (maxPoints - 1);
  const simplified: [number, number][] = [];
  for (let index = 0; index < maxPoints - 1; index += 1) {
    const point = coordinates[Math.round(index * step)];
    if (point) simplified.push(point);
  }
  const last = coordinates.at(-1);
  if (last) simplified.push(last);
  return simplified;
}

function boundsOf(coordinates: [number, number][]) {
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  if (minLng === maxLng) {
    minLng -= 0.002;
    maxLng += 0.002;
  }
  if (minLat === maxLat) {
    minLat -= 0.002;
    maxLat += 0.002;
  }

  return { minLng, maxLng, minLat, maxLat };
}

export function projectRouteCoordinates(
  coordinates: [number, number][],
  width: number,
  height: number,
): [number, number][] {
  const padX = Math.round(width * 0.11);
  const padTop = Math.round(height * 0.12);
  const padBottom = Math.round(height * 0.2);
  const innerWidth = width - padX * 2;
  const innerHeight = height - padTop - padBottom;
  const bounds = boundsOf(coordinates);
  const lngSpan = bounds.maxLng - bounds.minLng;
  const latSpan = bounds.maxLat - bounds.minLat;
  const scale = Math.min(innerWidth / lngSpan, innerHeight / latSpan);
  const usedWidth = lngSpan * scale;
  const usedHeight = latSpan * scale;
  const offsetX = padX + (innerWidth - usedWidth) / 2;
  const offsetY = padTop + (innerHeight - usedHeight) / 2;

  return coordinates.map(([lng, lat]): [number, number] => [
    offsetX + (lng - bounds.minLng) * scale,
    offsetY + (bounds.maxLat - lat) * scale,
  ]);
}

export function routeToSvg({
  coordinates,
  name,
  subtitle,
  background = null,
  width = STORY_GRAPHIC_SIZE.width,
  height = STORY_GRAPHIC_SIZE.height,
}: RouteGraphicOptions) {
  const points = projectRouteCoordinates(simplifyCoordinates(coordinates), width, height);
  const start = points[0];
  const finish = points.at(-1);
  if (!start || !finish) {
    throw new Error("A route needs at least two points to export");
  }

  const polyline = points
    .map((point) => `${point[0]?.toFixed(1)},${point[1]?.toFixed(1)}`)
    .join(" ");
  const stroke = Math.max(8, Math.round(width / 78));
  const dot = Math.max(10, Math.round(width / 54));
  const titleSize = Math.round(width / 16.5);
  const kickerSize = Math.round(width / 42);
  const subtitleSize = Math.round(width / 28);
  const [startX, startY] = start;
  const [finishX, finishY] = finish;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${background ? `<rect width="100%" height="100%" fill="${escapeXml(background)}"/>` : ""}
  <polyline fill="none" stroke="#c8ff52" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" points="${polyline}"/>
  <circle cx="${startX.toFixed(1)}" cy="${startY.toFixed(1)}" r="${dot}" fill="#0a0d0b" stroke="#c8ff52" stroke-width="${Math.round(stroke / 2)}"/>
  <circle cx="${finishX.toFixed(1)}" cy="${finishY.toFixed(1)}" r="${dot}" fill="#c8ff52"/>
  <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.84)}" fill="#c8ff52" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${kickerSize}" letter-spacing="6">RUN WITHOUT STOPS</text>
  <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.9)}" fill="#f4f7f5" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${titleSize}" font-weight="700">${escapeXml(name)}</text>
  ${
    subtitle
      ? `<text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.945)}" fill="#f4f7f5" fill-opacity="0.55" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${subtitleSize}">${escapeXml(subtitle)}</text>`
      : ""
  }
</svg>
`;
}
