import { SSO_COMPLETE_PATH } from "@/lib/auth/oauth";

type SsoNavigateArgs = {
  session?: { currentTask?: { key: string } | null | undefined } | null | undefined;
  decorateUrl: (url: string) => string;
  assign?: (url: string) => void;
};

export function navigateAfterSso({ decorateUrl, assign }: SsoNavigateArgs) {
  const url = decorateUrl(SSO_COMPLETE_PATH);
  (assign ?? ((next) => window.location.assign(next)))(url);
}
