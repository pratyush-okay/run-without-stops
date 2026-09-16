const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function createShareSlug(length = 10) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => SLUG_ALPHABET[byte % SLUG_ALPHABET.length]).join("");
}

export function sharePathForSlug(slug: string) {
  return `/r/${slug}`;
}

export function shareUrlForSlug(slug: string, origin: string) {
  return `${origin.replace(/\/$/, "")}${sharePathForSlug(slug)}`;
}

export function fileSafeName(name: string, fallback = "run-without-stops") {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || fallback;
}
