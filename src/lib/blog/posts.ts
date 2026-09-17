import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const postFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  slug: z.string().min(1),
  tags: z.array(z.string()).default([]),
  faqs: z.array(faqSchema).default([]),
});

export type BlogPost = z.infer<typeof postFrontmatterSchema> & {
  body: string;
};

export function parsePostMarkdown(raw: string, filename: string): BlogPost {
  const parsed = matter(raw);
  const data = postFrontmatterSchema.parse(parsed.data);
  if (path.basename(filename, ".md") !== data.slug) {
    throw new Error(`Blog slug "${data.slug}" must match filename "${filename}"`);
  }
  return { ...data, body: parsed.content.trim() };
}

export function listPublishedPosts(): BlogPost[] {
  let files: string[];
  try {
    files = readdirSync(BLOG_DIR).filter((file) => file.endsWith(".md"));
  } catch (error) {
    if (isMissingDir(error)) {
      return [];
    }
    throw error;
  }

  return files
    .map((file) => parsePostMarkdown(readFileSync(path.join(BLOG_DIR, file), "utf8"), file))
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function getPostBySlug(slug: string) {
  return listPublishedPosts().find((post) => post.slug === slug);
}

function isMissingDir(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
