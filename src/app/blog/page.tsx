import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell } from "@/components/blog/blog-shell";
import { listPublishedPosts } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Quieter running route notes",
  description: "Guides for planning runs with fewer lights, highways, and busy streets.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = listPublishedPosts();

  return (
    <BlogShell>
      <p className="rws-kicker">Blog</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Quieter running route notes</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
        How to plan a run you can keep moving on. Start from the{" "}
        <Link className="text-[#c8ff52] underline-offset-2 hover:underline" href="/">
          map
        </Link>
        .
      </p>
      {posts.length === 0 ? (
        <p className="mt-10 text-sm text-white/55">No notes yet.</p>
      ) : (
        <ul className="mt-10 grid gap-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="rws-panel block p-5 transition hover:border-white/20"
              >
                <p className="text-[11px] text-white/45">{post.date}</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">{post.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/65">{post.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </BlogShell>
  );
}
