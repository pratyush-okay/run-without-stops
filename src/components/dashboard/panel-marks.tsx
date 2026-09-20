import type { ReactNode } from "react";

function Glyph({
  children,
  className = "size-3",
  color,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={color ? { color } : undefined}
    >
      {children}
    </svg>
  );
}

export function DistanceGlyph() {
  return (
    <Glyph color="#c8ff52">
      <circle cx="3.4" cy="8" r="1.45" fill="currentColor" stroke="none" />
      <circle cx="12.6" cy="8" r="1.45" fill="currentColor" stroke="none" />
      <path d="M5.2 8h5.6" />
    </Glyph>
  );
}

export function PaceGlyph() {
  return (
    <Glyph color="#7ee8ff">
      <path d="M2.6 11.4h3.1M4.4 8.2h5M6.4 5h6.2" />
    </Glyph>
  );
}

export function TimeGlyph() {
  return (
    <Glyph color="#c4b5fd">
      <circle cx="8" cy="8.3" r="5.1" />
      <path d="M8 5.8v2.7l2.1 1.2" />
    </Glyph>
  );
}

export function SignalsGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
      <rect
        x="5.6"
        y="2.2"
        width="4.8"
        height="11.6"
        rx="2"
        fill="#1b211d"
        stroke="#ff8b8b"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="5.1" r="1.05" fill="#ff5a5a" />
      <circle cx="8" cy="8" r="1.05" fill="#ffc857" />
      <circle cx="8" cy="10.9" r="1.05" fill="#6ee07a" />
    </svg>
  );
}

export function CrossingsGlyph() {
  return (
    <Glyph color="#fde68a">
      <path d="M4.2 3.4v9.2M8 3.4v9.2M11.8 3.4v9.2" />
    </Glyph>
  );
}

export function MajorRoadGlyph() {
  return (
    <Glyph color="#ff9a73">
      <path d="M3.2 3.6v8.8M12.8 3.6v8.8M8 4.4v1.7M8 9.9v1.7" />
    </Glyph>
  );
}

export function ReverseGlyph() {
  return (
    <Glyph className="size-3.5" color="#7ee8ff">
      <path d="M3.2 5.4h9.6" />
      <path d="M10.2 3.2 13 5.4l-2.8 2.2" />
      <path d="M12.8 10.6H3.2" />
      <path d="M5.8 8.4 3 10.6l2.8 2.2" />
    </Glyph>
  );
}

export function LoopGlyph() {
  return (
    <Glyph className="size-3.5" color="#c8ff52">
      <path d="M12.5 8A4.5 4.5 0 1 1 8 3.5" />
      <path d="M6.3 2.7 8.1 4.7 10.1 2.6" />
    </Glyph>
  );
}

export function UndoGlyph() {
  return (
    <Glyph className="size-3.5" color="#f6c453">
      <path d="M6.4 3.6 3.2 6.6l3.2 3" />
      <path d="M3.4 6.6h6.1A3.3 3.3 0 1 1 6.4 12.4" />
    </Glyph>
  );
}

export function RedoGlyph() {
  return (
    <Glyph className="size-3.5" color="#f6c453">
      <path d="M9.6 3.6 12.8 6.6l-3.2 3" />
      <path d="M12.6 6.6H6.5A3.3 3.3 0 1 0 9.6 12.4" />
    </Glyph>
  );
}

export function ClearGlyph() {
  return (
    <Glyph className="size-3.5" color="#ff5d7a">
      <path d="M3.6 4.8h8.8" />
      <path d="M6.2 4.8V3.5h3.6v1.3M5.2 4.8l.7 8h4.2l.7-8" />
    </Glyph>
  );
}

export function CopyGlyph() {
  return (
    <Glyph className="size-3.5" color="#c4b5fd">
      <rect x="5.6" y="4.2" width="6.8" height="8.4" rx="1.2" />
      <path d="M5.4 11.2H4.3A1.3 1.3 0 0 1 3 9.9V3.8A1.3 1.3 0 0 1 4.3 2.5h6.1A1.3 1.3 0 0 1 11.7 3.8V4.2" />
    </Glyph>
  );
}

export function ExportGlyph() {
  return (
    <Glyph className="size-3.5" color="#7ee8ff">
      <path d="M8 3.2v7.2" />
      <path d="M5.3 7.4 8 10.2l2.7-2.8" />
      <path d="M3.4 12.6h9.2" />
    </Glyph>
  );
}

export function SaveGlyph() {
  return (
    <Glyph className="size-3.5" color="#c8ff52">
      <path d="M5 2.6h6v10.6L8 11.2 5 13.2V2.6Z" />
    </Glyph>
  );
}

export function ShareGlyph() {
  return (
    <Glyph className="size-3.5" color="#fb7185">
      <circle cx="4.1" cy="8" r="1.45" />
      <circle cx="11.7" cy="4.4" r="1.45" />
      <circle cx="11.7" cy="11.6" r="1.45" />
      <path d="M5.5 7.3 10.2 5.1M5.5 8.7 10.2 10.9" />
    </Glyph>
  );
}

export function ClimbGlyph() {
  return (
    <Glyph color="#ffb35c">
      <path d="M2.6 12.2 6.4 6.4 8.6 9.1 13.4 3.8" />
      <path d="M10.2 3.8h3.2v3.1" />
    </Glyph>
  );
}

export function DescentGlyph() {
  return (
    <Glyph color="#7ee8ff">
      <path d="M2.6 3.8 6.4 9.6 8.6 6.9 13.4 12.2" />
      <path d="M10.2 12.2h3.2V9.1" />
    </Glyph>
  );
}

export function MetricsExpandGlyph({ expanded }: { expanded: boolean }) {
  return (
    <Glyph className="size-3.5">
      {expanded ? <path d="M3.6 6.2 8 10.6 12.4 6.2" /> : <path d="M3.6 9.8 8 5.4 12.4 9.8" />}
    </Glyph>
  );
}

export function LocationGlyph({ className = "size-3.5" }: { className?: string }) {
  return (
    <Glyph className={className} color="#c8ff52">
      <circle cx="8" cy="8" r="2.6" />
      <path d="M8 1.7v2.2M8 12.1v2.2M1.7 8h2.2M12.1 8h2.2" />
    </Glyph>
  );
}

export function SearchGlyph({ className = "size-3.5" }: { className?: string }) {
  return (
    <Glyph className={className} color="#c8ff52">
      <circle cx="7" cy="7" r="4.1" />
      <path d="M10.2 10.2 13.5 13.5" />
    </Glyph>
  );
}

export function LayersGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <Glyph className={className} color="#c8ff52">
      <path d="M8 2.3 2.7 5.2 8 8.1l5.3-2.9L8 2.3Z" />
      <path d="M2.7 8.1 8 11l5.3-2.9" />
      <path d="M2.7 11 8 13.9 13.3 11" />
    </Glyph>
  );
}

export function MapLookGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <Glyph className={className} color="#c8ff52">
      <path d="M2.4 4.2 6.2 2.5l3.6 1.7 3.8-1.7v9.6l-3.8 1.7-3.6-1.7-3.8 1.7V4.2Z" />
      <path d="M6.2 2.5v9.6M9.8 4.2v9.6" />
    </Glyph>
  );
}
