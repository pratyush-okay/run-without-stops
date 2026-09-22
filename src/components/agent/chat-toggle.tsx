"use client";

import { ChatGlyph } from "@/components/dashboard/panel-marks";

type ChatToggleProps = {
  compact?: boolean;
  locked?: boolean;
  open: boolean;
  onToggle: () => void;
  onLockedClick?: () => void;
};

export function ChatToggle({
  compact = false,
  locked = false,
  open,
  onToggle,
  onLockedClick,
}: ChatToggleProps) {
  return (
    <div className={compact ? "rws-panel" : "rws-panel p-1.5"}>
      <button
        type="button"
        className={`grid shrink-0 place-items-center text-[#c8ff52] transition hover:bg-white/[0.06] hover:text-[#d6ff7a] ${
          compact ? "size-9 rounded-[1rem]" : "size-11 rounded-lg md:size-10"
        }`}
        onClick={() => {
          if (locked) {
            onLockedClick?.();
            return;
          }
          onToggle();
        }}
        aria-pressed={open}
        aria-label={locked ? "Chat" : open ? "Hide chat" : "Open chat"}
        title="Chat"
      >
        <ChatGlyph className="size-4" />
      </button>
    </div>
  );
}
