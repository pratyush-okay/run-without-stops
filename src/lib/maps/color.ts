export function liftMutedColor(color: string, amount: number) {
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((part) => part + part).join("") : hex;
    const value = Number.parseInt(full, 16);
    const r = liftChannel((value >> 16) & 255, amount);
    const g = liftChannel((value >> 8) & 255, amount);
    const b = liftChannel(value & 255, amount);
    return `rgb(${r} ${g} ${b})`;
  }

  const rgb = color.match(/rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/i);
  if (!rgb?.[1] || !rgb[2] || !rgb[3]) return null;
  return `rgb(${liftChannel(Number(rgb[1]), amount)} ${liftChannel(Number(rgb[2]), amount)} ${liftChannel(Number(rgb[3]), amount)})`;
}

function liftChannel(channel: number, amount: number) {
  return Math.round(channel + (220 - channel) * amount);
}
