import { ImageResponse } from "next/og";

export const alt = "Run Without Stops — quieter running routes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
      <svg
        width="280"
        height="250"
        viewBox="30.44 42 291.56 266"
        style={{ position: "absolute", top: 72, right: 80, opacity: 0.9 }}
      >
        <title>Run Without Stops</title>
        <g
          stroke="#c8ff52"
          strokeWidth="44"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          fill="none"
        >
          <path d="M218 96 L164 150 L88 150 L46 192" />
          <path d="M164 150 L224 210 L148 286 L80 286" />
          <path d="M224 210 L288 274 L322 274" />
        </g>
        <circle cx="104" cy="76" r="34" fill="#c8ff52" />
      </svg>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 64,
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
        <div
          style={{ display: "flex", fontSize: 52, fontWeight: 700, marginTop: 10, maxWidth: 760 }}
        >
          Quieter running routes
        </div>
        <div
          style={{ display: "flex", fontSize: 24, color: "rgba(244,247,245,0.62)", marginTop: 12 }}
        >
          Skip lights, highways, and busy streets.
        </div>
      </div>
    </div>,
    { ...size },
  );
}
