import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connecting your account",
  description: "Finishing Google sign in for Run Without Stops.",
  robots: { index: false, follow: false },
};

export default function SsoCallbackLayout({ children }: LayoutProps<"/sso-callback">) {
  return children;
}
