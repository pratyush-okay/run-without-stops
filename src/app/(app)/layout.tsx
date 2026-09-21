import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { IdentifyUser } from "@/components/analytics/identify-user";
import { clerkAppearance } from "@/lib/auth/appearance";
import { warmRoutingConnection } from "@/lib/routing/warm";
import { requestIsSearchCrawler } from "@/lib/seo/request-crawler";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (await requestIsSearchCrawler()) {
    return children;
  }

  warmRoutingConnection();

  return (
    <ClerkProvider appearance={clerkAppearance}>
      <IdentifyUser />
      {children}
    </ClerkProvider>
  );
}
