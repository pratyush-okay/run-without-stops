export type MapShortcut =
  | "shortcuts"
  | "undo"
  | "redo"
  | "mode"
  | "unit"
  | "style"
  | "elevation"
  | "pan-left"
  | "pan-right"
  | "pan-up"
  | "pan-down"
  | "center-point"
  | "delete-last";

export const SHORTCUT_ROWS = [
  { keys: "Z", label: "Undo" },
  { keys: "Shift+Z or Y", label: "Redo" },
  { keys: "R", label: "Switch Direct and Low stops" },
  { keys: "U", label: "Switch kilometres and miles" },
  { keys: "S", label: "Cycle map look" },
  { keys: "E", label: "Expand the elevation chart" },
  { keys: "Arrow keys", label: "Pan the map" },
  { keys: "Space", label: "Drop a point at the map center" },
  { keys: "Delete", label: "Remove the last point" },
  { keys: "?", label: "Show or hide these shortcuts" },
] as const;

export function shortcutTargetIsTyping(target: EventTarget | null) {
  if (typeof HTMLElement === "undefined" || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("dialog, [role='dialog'], [role='alertdialog']"));
}

export function mapShortcutFromKey(key: string, shiftKey: boolean): MapShortcut | undefined {
  if (key === "?" || (shiftKey && key === "/")) return "shortcuts";
  if (key === "z" || key === "Z") return shiftKey ? "redo" : "undo";
  if (key === "y" || key === "Y") return "redo";
  if (key === "r" || key === "R") return "mode";
  if (key === "u" || key === "U") return "unit";
  if (key === "s" || key === "S") return "style";
  if (key === "e" || key === "E") return "elevation";
  if (key === "ArrowLeft") return "pan-left";
  if (key === "ArrowRight") return "pan-right";
  if (key === "ArrowUp") return "pan-up";
  if (key === "ArrowDown") return "pan-down";
  if (key === " ") return "center-point";
  if (key === "Delete" || key === "Backspace") return "delete-last";
  return undefined;
}
