import type { OAuthStrategy } from "@clerk/nextjs/types";

export const SSO_CALLBACK_PATH = "/sso-callback";
export const SSO_CONTINUE_PATH = "/sso-continue";
export const SSO_COMPLETE_PATH = "/";

export type SocialProvider = {
  strategy: OAuthStrategy;
  label: string;
};

export const socialProviders: SocialProvider[] = [
  { strategy: "oauth_google", label: "Continue with Google" },
];

export function ssoErrorMessage(message: string | undefined) {
  if (!message) return undefined;
  if (/does not match one of the allowed values for parameter strategy/i.test(message)) {
    return "Google sign-in isn't available right now. Use email instead.";
  }
  return message;
}
