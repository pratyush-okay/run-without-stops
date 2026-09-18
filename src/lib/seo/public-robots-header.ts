/** Homepage is the only Clerk-fronted public URL. Overwrite any noindex Clerk adds. */
export function applyHomepageIndexRobotsTag(pathname: string, headers: Headers) {
  if (pathname === "/") {
    headers.set("X-Robots-Tag", "index, follow");
  }
}
