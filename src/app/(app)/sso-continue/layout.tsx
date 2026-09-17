import type { Metadata } from "next";
import { requestIsSearchCrawler } from "@/lib/seo/request-crawler";

export const metadata: Metadata = {
  title: "Finish creating your account",
  description: "Add the last details so Run Without Stops can save your routes.",
  robots: { index: false, follow: false },
};

export default async function SsoContinueLayout({ children }: LayoutProps<"/sso-continue">) {
  if (await requestIsSearchCrawler()) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#0a0d0b] px-4 text-white">
        <section className="rws-panel w-full max-w-md p-5">
          <h1 className="text-lg font-semibold tracking-tight">Finish creating your account</h1>
          <p className="mt-2 text-xs text-white/55">
            Add the last details so Run Without Stops can save your routes.
          </p>
        </section>
      </main>
    );
  }
  return children;
}
