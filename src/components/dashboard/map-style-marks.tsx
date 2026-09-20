import type { ReactNode } from "react";
import type { MapStyleId } from "@/lib/maps/styles";

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 16 16" className="size-7" aria-hidden>
      {children}
    </svg>
  );
}

export function DarkStyleMark() {
  return (
    <Mark>
      <rect width="16" height="16" rx="3.2" fill="#161a18" />
      <path d="M2 7.2h12M2 10.4h12M5.2 2v12M10.4 2v12" stroke="#c8ff52" strokeWidth="1.1" />
      <circle cx="11.1" cy="4.6" r="2.15" fill="#c8ff52" />
      <circle cx="12.15" cy="4.15" r="1.55" fill="#161a18" />
    </Mark>
  );
}

export function StreetsStyleMark() {
  return (
    <Mark>
      <rect width="16" height="16" rx="3.2" fill="#efe8d6" />
      <rect x="1.6" y="1.6" width="5.4" height="4.6" rx="1" fill="#8fce6a" />
      <rect x="9.2" y="9.4" width="5.2" height="5" rx="1" fill="#7ec36a" />
      <path d="M2 8.1h12" stroke="#f2c14b" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8.1 2v12" stroke="#f2c14b" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M2 8.1h12M8.1 2v12" stroke="#fff8e8" strokeWidth="0.7" strokeDasharray="1.4 1.1" />
      <circle cx="12.2" cy="3.7" r="1.35" fill="#4d8fdf" />
    </Mark>
  );
}

export function SatelliteStyleMark() {
  return (
    <Mark>
      <rect width="16" height="16" rx="3.2" fill="#1d3f62" />
      <circle cx="8" cy="8.2" r="5.1" fill="#2f6a3a" />
      <path d="M4.1 7.1c1.4-1.8 3.1-2.2 5.2-1.1 1.6.8 2.6.3 3.4-1" fill="#6b8f3d" />
      <path d="M3.6 9.4c1.8.2 2.9 1.4 4.8 1.6 1.7.2 2.8-.6 3.9-1.6" fill="#8a6a3a" />
      <path
        d="M4.2 10.8c1.3 1.4 3 2.1 4.6 1.6"
        stroke="#3f88c5"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="11.6" cy="3.5" r="1.05" fill="#f4f7f5" />
      <path d="M12.4 4.3 13.7 5.6" stroke="#f4f7f5" strokeWidth="1.1" strokeLinecap="round" />
    </Mark>
  );
}

export function MapStyleMark({ id }: { id: MapStyleId }) {
  if (id === "streets") return <StreetsStyleMark />;
  if (id === "satellite") return <SatelliteStyleMark />;
  return <DarkStyleMark />;
}
