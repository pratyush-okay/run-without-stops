/** Homepage is the only Clerk-fronted public URL. Overwrite any noindex Clerk adds. */
export function applyHomepageIndexRobotsTag(pathname: string, headers: Headers) {
  if (pathname === "/") {
    headers.set("X-Robots-Tag", "index, follow");
    const vary = headers.get("Vary");
    const values = vary?.split(",").map((value) => value.trim().toLowerCase()) ?? [];
    if (!values.includes("user-agent")) {
      headers.set("Vary", vary ? `${vary}, User-Agent` : "User-Agent");
    }
  }
}
