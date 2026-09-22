"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { type MapShortcut, mapShortcutFromKey, shortcutTargetIsTyping } from "@/lib/maps/shortcuts";

export function useMapShortcuts(onShortcut: RefObject<(shortcut: MapShortcut) => void>) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const shortcut = mapShortcutFromKey(event.key, event.shiftKey);
      if (!shortcut) return;
      if (shortcut === "shortcuts") {
        if (shortcutTargetIsTyping(event.target) && !openRef.current) return;
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }
      if (openRef.current || shortcutTargetIsTyping(event.target)) return;
      event.preventDefault();
      onShortcut.current(shortcut);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onShortcut]);

  return { shortcutsOpen: open, setShortcutsOpen: setOpen };
}
