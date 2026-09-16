import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SSO_COMPLETE_PATH } from "@/lib/auth/oauth";

type SsoNavigateArgs = {
  session?: { currentTask?: { key: string } | null } | null;
  decorateUrl: (url: string) => string;
  router: AppRouterInstance;
};

export function navigateAfterSso({ session, decorateUrl, router }: SsoNavigateArgs) {
  if (session?.currentTask) {
    return;
  }

  const url = decorateUrl(SSO_COMPLETE_PATH);
  if (url.startsWith("http")) {
    window.location.href = url;
    return;
  }
  router.push(url);
}
