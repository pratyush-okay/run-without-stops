import type { Metadata } from "next";
import { RunningDashboard } from "@/components/dashboard/running-dashboard";
import { AllowPublicIndexing } from "@/components/seo/allow-public-indexing";
import { HomeDetails } from "@/components/seo/home-details";
import { HomeIntro } from "@/components/seo/home-intro";
import { env } from "@/env";
import { HOME_FAQS } from "@/lib/seo/home-faqs";
import { JsonLd } from "@/lib/seo/json-ld";
import { requestIsSearchCrawler } from "@/lib/seo/request-crawler";
import {
  absoluteUrl,
  defaultSocialImages,
  PUBLIC_PAGE_ROBOTS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  siteOrigin,
} from "@/lib/seo/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  robots: PUBLIC_PAGE_ROBOTS,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: defaultSocialImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: defaultSocialImages(),
  },
};

export default async function Home() {
  const origin = siteOrigin();
  const crawler = await requestIsSearchCrawler();
  return (
    <div className="bg-[#0a0d0b]">
      {crawler ? null : <AllowPublicIndexing />}
      <div className="relative h-dvh min-h-dvh overflow-hidden">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                name: SITE_NAME,
                url: origin,
                description: SITE_DESCRIPTION,
                logo: absoluteUrl("/icon-512.png", origin),
                sameAs: ["https://github.com/pratyush-okay/run-without-stops"],
              },
              {
                "@type": "WebSite",
                name: SITE_NAME,
                url: origin,
                description: SITE_DESCRIPTION,
              },
              {
                "@type": "SoftwareApplication",
                name: SITE_NAME,
                applicationCategory: "HealthApplication",
                operatingSystem: "Web",
                url: origin,
                description: SITE_DESCRIPTION,
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "AUD",
                },
              },
              {
                "@type": "FAQPage",
                mainEntity: HOME_FAQS.map((faq) => ({
                  "@type": "Question",
                  name: faq.question,
                  acceptedAnswer: { "@type": "Answer", text: faq.answer },
                })),
              },
            ],
          }}
        />
        <HomeIntro />
        {crawler ? (
          <div className="h-full w-full bg-[#0a0d0b]" />
        ) : (
          <RunningDashboard mapboxToken={env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN} />
        )}
      </div>
      <HomeDetails />
    </div>
  );
}
