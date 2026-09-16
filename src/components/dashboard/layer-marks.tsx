import type { ReactNode } from "react";

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      {children}
    </svg>
  );
}

export function TrafficLightMark() {
  return (
    <Mark>
      <rect x="6" y="2" width="4" height="12" rx="2" fill="#1b211d" />
      <circle cx="8" cy="4.6" r="1.15" fill="#ff5a5a" />
      <circle cx="8" cy="8" r="1.15" fill="#ffc857" />
      <circle cx="8" cy="11.4" r="1.15" fill="#6ee07a" />
    </Mark>
  );
}

export function CrossingMark() {
  return (
    <Mark>
      <rect x="4" y="3.5" width="1.5" height="9" rx="0.5" fill="#f4f7f5" />
      <rect x="7.25" y="3.5" width="1.5" height="9" rx="0.5" fill="#f4f7f5" />
      <rect x="10.5" y="3.5" width="1.5" height="9" rx="0.5" fill="#f4f7f5" />
    </Mark>
  );
}

export function WaterMark() {
  return (
    <Mark>
      <path
        d="M8 2.4C10.4 5.1 11.4 7.2 11.4 9.1A3.4 3.4 0 0 1 8 12.5 3.4 3.4 0 0 1 4.6 9.1C4.6 7.2 5.6 5.1 8 2.4Z"
        fill="#7ee8ff"
      />
    </Mark>
  );
}

export function ParkMark() {
  return (
    <Mark>
      <circle cx="8" cy="6.2" r="3.4" fill="#8fd36a" />
      <rect x="7.25" y="9.2" width="1.5" height="4" rx="0.6" fill="#c8d4c4" />
    </Mark>
  );
}

export function HighwayMark() {
  return (
    <Mark>
      <rect x="3" y="3.2" width="10" height="9.6" rx="2" fill="#1b211d" />
      <rect x="4.4" y="4.5" width="1.1" height="7" rx="0.5" fill="#ff9a73" />
      <rect x="10.5" y="4.5" width="1.1" height="7" rx="0.5" fill="#ff9a73" />
      <rect x="7.45" y="5.2" width="1.1" height="1.6" rx="0.4" fill="#f4f7f5" />
      <rect x="7.45" y="8.2" width="1.1" height="1.6" rx="0.4" fill="#f4f7f5" />
    </Mark>
  );
}

export function BusyRoadMark() {
  return (
    <Mark>
      <rect x="3" y="3.2" width="10" height="9.6" rx="2" fill="#1b211d" />
      <rect x="4.4" y="4.5" width="1.1" height="7" rx="0.5" fill="#f6c453" />
      <rect x="10.5" y="4.5" width="1.1" height="7" rx="0.5" fill="#f6c453" />
      <rect x="7.45" y="5.2" width="1.1" height="1.6" rx="0.4" fill="#f4f7f5" />
      <rect x="7.45" y="8.2" width="1.1" height="1.6" rx="0.4" fill="#f4f7f5" />
    </Mark>
  );
}
