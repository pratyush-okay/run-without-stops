import {
  APEX_HOSTNAME,
  APEX_TO_WWW_STATUS,
  apexToWwwRedirects,
  hostnameWithoutPort,
  isApexHostname,
  WWW_HOSTNAME,
  WWW_ORIGIN,
  wwwUrlFor,
} from "@/lib/seo/host-redirect";

describe("apex to www host redirect", () => {
  it("treats the bare domain as apex even with a port", () => {
    expect(isApexHostname(APEX_HOSTNAME)).toBe(true);
    expect(isApexHostname(`${APEX_HOSTNAME}:443`)).toBe(true);
    expect(isApexHostname(WWW_HOSTNAME)).toBe(false);
    expect(hostnameWithoutPort(`${APEX_HOSTNAME}:3000`)).toBe(APEX_HOSTNAME);
  });

  it("rewrites HTTP apex URLs onto HTTPS www and keeps the path", () => {
    const next = wwwUrlFor(new URL("http://runwithoutstops.com/blog?q=1"));
    expect(next.href).toBe(`${WWW_ORIGIN}/blog?q=1`);
  });

  it("uses 301 so crawlers that skip 308 still follow to www", () => {
    expect(APEX_TO_WWW_STATUS).toBe(301);
    expect(apexToWwwRedirects.every((rule) => rule.statusCode === 301)).toBe(true);
    expect(apexToWwwRedirects[0]?.destination).toBe(`${WWW_ORIGIN}/`);
  });
});
