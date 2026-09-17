import Link from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function headingText(children: ReactNode): string {
  if (Array.isArray(children)) {
    return children.map(headingText).join("");
  }
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  return "";
}

export function BlogMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="blog-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const id = headingId(headingText(children));
            return <h2 id={id || undefined}>{children}</h2>;
          },
          a: ({ href, children }) => {
            if (href?.startsWith("/")) {
              return (
                <Link href={href} className="text-[#c8ff52] underline-offset-2 hover:underline">
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                className="text-[#c8ff52] underline-offset-2 hover:underline"
                rel="noreferrer"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
