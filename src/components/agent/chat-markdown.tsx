import Link from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function ChatLink({ href, children }: { href?: string | undefined; children: ReactNode }) {
  if (href?.startsWith("/")) {
    return (
      <Link href={href} className="text-[#c8ff52] underline-offset-2 hover:underline">
        {children}
      </Link>
    );
  }
  if (!href) return <span>{children}</span>;
  return (
    <a href={href} className="text-[#c8ff52] underline-offset-2 hover:underline" rel="noreferrer">
      {children}
    </a>
  );
}

export function ChatMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="rws-chat-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => <ChatLink href={href}>{children}</ChatLink>,
          img: () => null,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
