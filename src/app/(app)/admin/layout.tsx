import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description: "Configure which OpenRouter models are available in chat.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
