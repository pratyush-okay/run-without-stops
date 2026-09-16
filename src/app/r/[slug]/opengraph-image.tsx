import { ImageResponse } from "next/og";
import {
  CARD_GRAPHIC_SIZE,
  projectRouteCoordinates,
  simplifyCoordinates,
} from "@/lib/routing/graphic";
import { shareSlugSchema } from "@/lib/schemas/saved-route";
import { getSavedRouteBySlug } from "@/lib/supabase/saved-routes";

export const size = CARD_GRAPHIC_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = shareSlugSchema.safeParse(slug);
  const saved = parsed.success ? await getSavedRouteBySlug(parsed.data) : null;
  const name = saved?.name ?? "Run Without Stops";
  const points = saved
    ? projectRouteCoordinates(simplifyCoordinates(saved.route.coordinates), size.width, size.height)
    : [];
  const polyline = points
    .map((point) => `${point[0]?.toFixed(1) ?? "0"},${point[1]?.toFixed(1) ?? "0"}`)
    .join(" ");
  const start = points[0];
  const finish = points.at(-1);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#0a0d0b",
        color: "#f4f7f5",
        position: "relative",
      }}
    >
      {polyline ? (
        <svg
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          style={{ position: "absolute", inset: 0 }}
        >
          <title>{name}</title>
          <polyline
            fill="none"
            stroke="#c8ff52"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polyline}
          />
          {start ? (
            <circle
              cx={start[0]}
              cy={start[1]}
              r="11"
              fill="#0a0d0b"
              stroke="#c8ff52"
              strokeWidth="4"
            />
          ) : null}
          {finish ? <circle cx={finish[0]} cy={finish[1]} r="11" fill="#c8ff52" /> : null}
        </svg>
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 56,
          width: "100%",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 18,
            letterSpacing: 6,
            color: "#c8ff52",
            fontFamily: "monospace",
          }}
        >
          RUN WITHOUT STOPS
        </div>
        <div style={{ display: "flex", fontSize: 52, fontWeight: 700, marginTop: 8 }}>{name}</div>
      </div>
    </div>,
    { ...size },
  );
}
