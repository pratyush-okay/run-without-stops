import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { IdentifyUser } from "@/components/analytics/identify-user";
import { clerkAppearance } from "@/lib/auth/appearance";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <IdentifyUser />
      {children}
    </ClerkProvider>
  );
}
