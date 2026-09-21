export const APEX_HOSTNAME = "runwithoutstops.com";
export const WWW_HOSTNAME = "www.runwithoutstops.com";
export const WWW_ORIGIN = "https://www.runwithoutstops.com";
export const APEX_TO_WWW_STATUS = 301;

export function hostnameWithoutPort(host: string) {
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

export function isApexHostname(host: string | null | undefined) {
  if (!host) {
    return false;
  }
  return hostnameWithoutPort(host) === APEX_HOSTNAME;
}

export function wwwUrlFor(url: URL) {
  const next = new URL(url.href);
  next.protocol = "https:";
  next.hostname = WWW_HOSTNAME;
  next.port = "";
  return next;
}

export const apexToWwwRedirects = [
  {
    source: "/",
    has: [{ type: "host" as const, value: APEX_HOSTNAME }],
    destination: `${WWW_ORIGIN}/`,
    statusCode: APEX_TO_WWW_STATUS,
  },
  {
    source: "/:path*",
    has: [{ type: "host" as const, value: APEX_HOSTNAME }],
    destination: `${WWW_ORIGIN}/:path*`,
    statusCode: APEX_TO_WWW_STATUS,
  },
];
