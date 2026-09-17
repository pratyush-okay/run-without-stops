import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function BlogMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="blog-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
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
