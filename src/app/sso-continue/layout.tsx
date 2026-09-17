import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finish creating your account",
  description: "Add the last details so Run Without Stops can save your routes.",
  robots: { index: false, follow: false },
};

export default function SsoContinueLayout({ children }: LayoutProps<"/sso-continue">) {
  return children;
}
