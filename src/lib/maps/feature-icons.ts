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

function paintDisc(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.arc(CENTER, CENTER, 21, 0, Math.PI * 2);
  context.fillStyle = "#101512";
  context.fill();
}

function paintDroplet(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.moveTo(CENTER, 16);
  context.bezierCurveTo(44, 28, 44, 40, CENTER, 48);
  context.bezierCurveTo(20, 40, 20, 28, CENTER, 16);
  context.closePath();
  context.fillStyle = "#7ee8ff";
  context.fill();
}

export function createCrossingIconImage() {
  const context = canvasContext();
  if (!context) return undefined;

  paintDisc(context);
  context.fillStyle = "#f4f7f5";
  for (const x of [23, 30, 37]) {
    roundedRect(context, x, 20, 4, 24, 1.2);
    context.fill();
  }

  return context.getImageData(0, 0, SIZE, SIZE);
}

export function createWaterDropletIconImage() {
  const context = canvasContext();
  if (!context) return undefined;

  paintDisc(context);
  paintDroplet(context);

  return context.getImageData(0, 0, SIZE, SIZE);
}

export function createTrafficLightIconImage() {
  const context = canvasContext();
  if (!context) return undefined;

  paintDisc(context);
  roundedRect(context, 27, 16, 10, 32, 5);
  context.fillStyle = "#1b211d";
  context.fill();

  const lamps = [
    { y: 23, color: "#ff5a5a" },
    { y: 32, color: "#ffc857" },
    { y: 41, color: "#6ee07a" },
  ];
  for (const lamp of lamps) {
    context.beginPath();
    context.arc(CENTER, lamp.y, 3.2, 0, Math.PI * 2);
    context.fillStyle = lamp.color;
    context.fill();
  }

  return context.getImageData(0, 0, SIZE, SIZE);
}
