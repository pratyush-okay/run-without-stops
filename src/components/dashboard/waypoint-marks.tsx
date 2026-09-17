import type { WaypointRole } from "@/lib/routing/waypoints";

export function WaypointBadge({ role, label }: { role: WaypointRole; label: string }) {
  if (role === "via") {
    return (
      <span
        aria-hidden
        className="grid size-6 shrink-0 place-items-center rounded-full border border-[#c8ff52]/50 bg-[#c8ff52]/10 font-mono text-[10px] text-[#c8ff52]"
      >
        {label}
      </span>
    );
  }

  if (role === "finish") {
    return (
      <span
        aria-hidden
        className="grid size-6 shrink-0 place-items-center rounded-full bg-[#ff5d7a]"
      >
        <span className="size-2 rounded-[2px] bg-[#fff5f7]" />
      </span>
    );
  }

  if (role === "start_finish") {
    return (
      <span
        aria-hidden
        className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#101512] px-1.5 ring-1 ring-white/15"
      >
        <span className="size-3 rounded-full bg-[#c8ff52]" />
        <span className="size-3 rounded-full bg-[#ff5d7a]" />
      </span>
    );
  }

  return (
    <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-[#c8ff52]">
      <span className="size-2 rounded-full bg-[#101512]" />
    </span>
  );
}
