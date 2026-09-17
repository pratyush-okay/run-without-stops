import { breadcrumbListJsonLd } from "@/lib/seo/breadcrumbs";
import { PRODUCTION_SITE_ORIGIN } from "@/lib/seo/site";

describe("breadcrumb JSON-LD", () => {
  it("builds Home → Notes → article positions", () => {
    expect(
      breadcrumbListJsonLd(
        [
          { name: "Map", path: "/" },
          { name: "Notes", path: "/blog" },
          { name: "Traffic lights", path: "/blog/traffic" },
        ],
        PRODUCTION_SITE_ORIGIN,
      ),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Map",
          item: PRODUCTION_SITE_ORIGIN,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Notes",
          item: `${PRODUCTION_SITE_ORIGIN}/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Traffic lights",
          item: `${PRODUCTION_SITE_ORIGIN}/blog/traffic`,
        },
      ],
    });
  });
});
