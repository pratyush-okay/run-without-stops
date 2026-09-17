import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { IdentifyUser } from "@/components/analytics/identify-user";
import { clerkAppearance } from "@/lib/auth/appearance";
import { shouldMountClerkProvider } from "@/lib/seo/search-crawler";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const userAgent = (await headers()).get("user-agent");
  if (!shouldMountClerkProvider(userAgent)) {
    return children;
  }

  return (
    <ClerkProvider appearance={clerkAppearance}>
      <IdentifyUser />
      {children}
    </ClerkProvider>
  );
}
