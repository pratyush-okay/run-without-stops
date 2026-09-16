export function shortPlaceLabel(label: string) {
  const first = label.split(",")[0]?.trim();
  return first && first.length > 0 ? first : "Pinned place";
}
