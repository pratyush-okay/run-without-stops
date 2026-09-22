import Link from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function ChatLink({
  href,
  children,
  tone,
}: {
  href?: string | undefined;
  children: ReactNode;
  tone: "plain" | "reply";
}) {
  const className =
    tone === "reply"
      ? "text-[#0a0d0b] underline decoration-[#0a0d0b]/40 underline-offset-2 hover:decoration-[#0a0d0b]"
      : "text-[#c8ff52] underline-offset-2 hover:underline";
  if (href?.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  if (!href) return <span>{children}</span>;
  return (
    <a href={href} className={className} rel="noreferrer">
      {children}
    </a>
  );
}

export function ChatMarkdown({
  markdown,
  tone = "plain",
}: {
  markdown: string;
  tone?: "plain" | "reply";
}) {
  return (
    <div className={tone === "reply" ? "rws-chat-md rws-chat-md-reply" : "rws-chat-md"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <ChatLink href={href} tone={tone}>
              {children}
            </ChatLink>
          ),
          img: () => null,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
