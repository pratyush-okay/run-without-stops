import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogBreadcrumbs } from "@/components/blog/blog-breadcrumbs";
import { BlogMarkdown } from "@/components/blog/blog-markdown";
import { BlogShell } from "@/components/blog/blog-shell";
import { getPostBySlug, listPublishedPosts } from "@/lib/blog/posts";
import { breadcrumbListJsonLd } from "@/lib/seo/breadcrumbs";
import { JsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl, defaultSocialImages, OG_IMAGE_PATH, SITE_NAME } from "@/lib/seo/site";

type BlogPostPageProps = PageProps<"/blog/[slug]">;

export function generateStaticParams() {
  return listPublishedPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: "Note not found" };
  }
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      url: `/blog/${post.slug}`,
      images: defaultSocialImages(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [OG_IMAGE_PATH],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const url = absoluteUrl(`/blog/${post.slug}`);
  const related = listPublishedPosts().filter((item) => item.slug !== post.slug);
  const crumbs = [
    { name: "Map", path: "/" },
    { name: "Quieter route notes", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ];
  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      datePublished: post.date,
      dateModified: post.date,
      description: post.description,
      mainEntityOfPage: url,
      image: absoluteUrl("/opengraph-image"),
      author: { "@type": "Organization", name: SITE_NAME },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        logo: { "@type": "ImageObject", url: absoluteUrl("/icon-512.png") },
      },
    },
  ];

  if (post.faqs.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }

  jsonLd.push(breadcrumbListJsonLd(crumbs));

  return (
    <BlogShell>
      <JsonLd data={jsonLd} />
      <BlogBreadcrumbs items={crumbs} />
      <p className="rws-kicker mt-3">{post.date}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{post.title}</h1>
      <p className="mt-3 text-sm leading-6 text-white/65">{post.description}</p>
      <article className="mt-8">
        <BlogMarkdown markdown={post.body} />
      </article>
      <nav className="mt-12 border-t border-white/10 pt-6 text-sm leading-6 text-white/65">
        <p>
          Back to{" "}
          <Link className="text-[#c8ff52] underline-offset-2 hover:underline" href="/blog">
            quieter route notes
          </Link>
          {" · "}
          <Link className="text-[#c8ff52] underline-offset-2 hover:underline" href="/">
            map
          </Link>
        </p>
        {related.length > 0 ? (
          <ul className="mt-4 grid gap-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  className="text-[#c8ff52] underline-offset-2 hover:underline"
                  href={`/blog/${item.slug}`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </nav>
    </BlogShell>
  );
}
