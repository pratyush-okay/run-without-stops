export const HSTS_HEADER = "max-age=63072000; includeSubDomains; preload";

export function applyHsts(headers: Headers) {
  headers.set("Strict-Transport-Security", HSTS_HEADER);
}
