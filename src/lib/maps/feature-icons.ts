const SIZE = 64;
const CENTER = 32;

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function canvasContext() {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  return context ?? undefined;
}

function paintChip(context: CanvasRenderingContext2D) {
  roundedRect(context, 6, 6, 52, 52, 14);
  context.fillStyle = "#101512";
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = "rgba(244, 247, 245, 0.16)";
  context.stroke();
}

function paintTrafficGlyph(context: CanvasRenderingContext2D, cx: number, cy: number) {
  roundedRect(context, cx - 6, cy - 16, 12, 32, 6);
  context.fillStyle = "#1b211d";
  context.fill();

  const lamps = [
    { y: cy - 8.5, color: "#ff5a5a" },
    { y: cy, color: "#ffc857" },
    { y: cy + 8.5, color: "#6ee07a" },
  ];
  for (const lamp of lamps) {
    context.beginPath();
    context.arc(cx, lamp.y, 3.4, 0, Math.PI * 2);
    context.fillStyle = lamp.color;
    context.fill();
  }
}

function paintCrossingGlyph(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  compact = false,
) {
  const width = compact ? 3.4 : 5;
  const height = compact ? 16 : 24;
  const radius = compact ? 1 : 1.4;
  const xs = compact ? [cx - 7, cx - 1.2, cx + 4.6] : [cx - 11, cx - 2, cx + 7];
  context.fillStyle = "#f4f7f5";
  for (const x of xs) {
    roundedRect(context, x, cy - height / 2, width, height, radius);
    context.fill();
  }
}

function paintDroplet(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.moveTo(CENTER, 18);
  context.bezierCurveTo(44, 30, 44, 41, CENTER, 48);
  context.bezierCurveTo(20, 41, 20, 30, CENTER, 18);
  context.closePath();
  context.fillStyle = "#7ee8ff";
  context.fill();
}

export function createCrossingIconImage() {
  const context = canvasContext();
  if (!context) return undefined;

  paintChip(context);
  paintCrossingGlyph(context, CENTER, CENTER);

  return context.getImageData(0, 0, SIZE, SIZE);
}

export function createWaterDropletIconImage() {
  const context = canvasContext();
  if (!context) return undefined;

  paintChip(context);
  paintDroplet(context);

  return context.getImageData(0, 0, SIZE, SIZE);
}

export function createTrafficLightIconImage() {
  const context = canvasContext();
  if (!context) return undefined;

  paintChip(context);
  paintTrafficGlyph(context, CENTER, CENTER);

  return context.getImageData(0, 0, SIZE, SIZE);
}

function paintTriangle(context: CanvasRenderingContext2D, color: string, direction: "up" | "down") {
  context.beginPath();
  if (direction === "up") {
    context.moveTo(CENTER, 18);
    context.lineTo(46, 44);
    context.lineTo(18, 44);
  } else {
    context.moveTo(18, 20);
    context.lineTo(46, 20);
    context.lineTo(CENTER, 46);
  }
  context.closePath();
  context.fillStyle = color;
  context.fill();
}

export function createClimbIconImage() {
  const context = canvasContext();
  if (!context) return undefined;
  paintChip(context);
  paintTriangle(context, "#ffb35c", "up");
  return context.getImageData(0, 0, SIZE, SIZE);
}

export function createDescentIconImage() {
  const context = canvasContext();
  if (!context) return undefined;
  paintChip(context);
  paintTriangle(context, "#7ee8ff", "down");
  return context.getImageData(0, 0, SIZE, SIZE);
}

const COMBINED_HEIGHT = 64;

type CombinedSlot = "start" | "finish" | "via" | "traffic_signal" | "crossing";

function combinedSlots(
  role: "start" | "finish" | "start_finish" | "via",
  kind?: "traffic_signal" | "crossing",
): CombinedSlot[] {
  if (role === "start_finish") {
    return kind ? ["start", "finish", kind] : ["start", "finish"];
  }
  return kind ? [role, kind] : [role];
}

function combinedCanvasWidth(slots: number) {
  return slots >= 3 ? 156 : 108;
}

function paintStartBadge(context: CanvasRenderingContext2D, cx: number, cy: number) {
  context.beginPath();
  context.arc(cx, cy, 13, 0, Math.PI * 2);
  context.fillStyle = "#c8ff52";
  context.fill();
  context.lineWidth = 2.2;
  context.strokeStyle = "#101512";
  context.stroke();
  context.beginPath();
  context.arc(cx, cy, 3.2, 0, Math.PI * 2);
  context.fillStyle = "#101512";
  context.fill();
}

function paintFinishBadge(context: CanvasRenderingContext2D, cx: number, cy: number) {
  context.beginPath();
  context.arc(cx, cy, 13, 0, Math.PI * 2);
  context.fillStyle = "#ff5d7a";
  context.fill();
  context.lineWidth = 2.4;
  context.strokeStyle = "#fff5f7";
  context.stroke();
  context.beginPath();
  context.arc(cx, cy, 3.6, 0, Math.PI * 2);
  context.fillStyle = "#fff5f7";
  context.fill();
}

function paintViaBadge(context: CanvasRenderingContext2D, cx: number, cy: number) {
  context.beginPath();
  context.arc(cx, cy, 15, 0, Math.PI * 2);
  context.fillStyle = "#0a0d0b";
  context.fill();
  context.lineWidth = 2.4;
  context.strokeStyle = "#c8ff52";
  context.stroke();
}

function paintCombinedSlot(
  context: CanvasRenderingContext2D,
  slot: CombinedSlot,
  cx: number,
  cy: number,
) {
  if (slot === "start") {
    paintStartBadge(context, cx, cy);
    return;
  }
  if (slot === "finish") {
    paintFinishBadge(context, cx, cy);
    return;
  }
  if (slot === "via") {
    paintViaBadge(context, cx, cy);
    return;
  }
  if (slot === "traffic_signal") {
    paintTrafficGlyph(context, cx, cy);
    return;
  }
  paintCrossingGlyph(context, cx, cy, true);
}

export function createCombinedMarkIconImage(
  role: "start" | "finish" | "start_finish" | "via",
  kind?: "traffic_signal" | "crossing",
) {
  const slots = combinedSlots(role, kind);
  if (slots.length === 0) return undefined;

  const width = combinedCanvasWidth(slots.length);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = COMBINED_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) return undefined;

  roundedRect(context, 2, 10, width - 4, 44, 22);
  context.fillStyle = "#101512";
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = "rgba(200, 255, 82, 0.28)";
  context.stroke();

  const inset = 20;
  const span = width - inset * 2;
  for (const [index, slot] of slots.entries()) {
    const cx = slots.length === 1 ? width / 2 : inset + (span * index) / (slots.length - 1);
    if (index > 0) {
      const prevX =
        slots.length === 1 ? width / 2 : inset + (span * (index - 1)) / (slots.length - 1);
      context.fillStyle = "rgba(244, 247, 245, 0.12)";
      context.fillRect((prevX + cx) / 2 - 0.75, 18, 1.5, 28);
    }
    paintCombinedSlot(context, slot, cx, 32);
  }

  return context.getImageData(0, 0, width, COMBINED_HEIGHT);
}
