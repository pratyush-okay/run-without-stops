import { mapShortcutFromKey, shortcutTargetIsTyping } from "@/lib/maps/shortcuts";

describe("map shortcuts", () => {
  it("maps the planner keys", () => {
    expect(mapShortcutFromKey("z", false)).toBe("undo");
    expect(mapShortcutFromKey("Z", true)).toBe("redo");
    expect(mapShortcutFromKey("y", false)).toBe("redo");
    expect(mapShortcutFromKey("r", false)).toBe("mode");
    expect(mapShortcutFromKey("u", false)).toBe("unit");
    expect(mapShortcutFromKey("s", false)).toBe("style");
    expect(mapShortcutFromKey("e", false)).toBe("elevation");
    expect(mapShortcutFromKey("ArrowLeft", false)).toBe("pan-left");
    expect(mapShortcutFromKey(" ", false)).toBe("center-point");
    expect(mapShortcutFromKey("Delete", false)).toBe("delete-last");
    expect(mapShortcutFromKey("?", false)).toBe("shortcuts");
  });

  it("ignores typing targets", () => {
    expect(shortcutTargetIsTyping(null)).toBe(false);
  });
});
