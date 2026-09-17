import type { Metadata } from "next";
import { requestIsSearchCrawler } from "@/lib/seo/request-crawler";

export const metadata: Metadata = {
  title: "Connecting your account",
  description: "Finishing Google sign in for Run Without Stops.",
  robots: { index: false, follow: false },
};

export default async function SsoCallbackLayout({ children }: LayoutProps<"/sso-callback">) {
  if (await requestIsSearchCrawler()) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#0a0d0b] px-4 text-white">
        <section className="rws-panel w-full max-w-md p-5">
          <h1 className="text-lg font-semibold tracking-tight">Connecting your account</h1>
          <p className="mt-2 text-xs text-white/55">
            Finishing Google sign in for Run Without Stops.
          </p>
        </section>
      </main>
    );
  }
  return children;
}
