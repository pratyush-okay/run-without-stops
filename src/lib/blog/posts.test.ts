import { listPublishedPosts, parsePostMarkdown } from "@/lib/blog/posts";

const SAMPLE = `---
title: Sample post
description: A test post for the loader.
date: "2026-09-17"
slug: sample-post
tags:
  - routing
---

Click the map and go.
`;

describe("parsePostMarkdown", () => {
  it("reads frontmatter and body", () => {
    const post = parsePostMarkdown(SAMPLE, "sample-post.md");
    expect(post.slug).toBe("sample-post");
    expect(post.title).toBe("Sample post");
    expect(post.tags).toEqual(["routing"]);
    expect(post.body).toBe("Click the map and go.");
    expect(post.faqs).toEqual([]);
  });

  it("rejects a slug that does not match the filename", () => {
    expect(() => parsePostMarkdown(SAMPLE, "other-post.md")).toThrow(/must match filename/);
  });
});

describe("listPublishedPosts", () => {
  it("includes the pillar without SSO or share URLs", () => {
    const posts = listPublishedPosts();
    expect(
      posts.some((post) => post.slug === "the-complete-guide-to-building-a-run-without-stops"),
    ).toBe(true);
    expect(
      posts.some(
        (post) =>
          post.slug === "a-runners-guide-to-traffic-lights-crossings-and-route-intelligence",
      ),
    ).toBe(true);
    expect(posts.every((post) => !post.slug.startsWith("sso-"))).toBe(true);
  });
});
