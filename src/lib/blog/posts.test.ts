import { listPublishedPosts, parsePostMarkdown, postDocumentTitle } from "@/lib/blog/posts";

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
    expect(post.howTo).toBeUndefined();
    expect(postDocumentTitle(post)).toBe("Sample post");
  });

  it("reads howTo steps when present", () => {
    const post = parsePostMarkdown(
      `---
title: Sample post
description: A test post for the loader.
date: "2026-09-17"
slug: sample-post
howTo:
  name: How to sample
  steps:
    - name: Open the map
      text: Click start.
    - name: Choose low-stop
      text: Leave direct off.
---

Click the map and go.
`,
      "sample-post.md",
    );
    expect(post.howTo?.name).toBe("How to sample");
    expect(post.howTo?.steps).toHaveLength(2);
  });

  it("uses seoTitle for the document title when present", () => {
    const post = parsePostMarkdown(
      SAMPLE.replace("title: Sample post", "title: Sample post\nseoTitle: Short sample title"),
      "sample-post.md",
    );
    expect(post.seoTitle).toBe("Short sample title");
    expect(postDocumentTitle(post)).toBe("Short sample title");
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
    expect(
      posts.some(
        (post) => post.slug === "how-to-build-low-stop-running-routes-with-run-without-stops",
      ),
    ).toBe(true);
    expect(
      posts.some((post) => post.slug === "how-to-use-the-run-without-stops-route-builder"),
    ).toBe(true);
    expect(posts.every((post) => !post.slug.startsWith("sso-"))).toBe(true);
    expect(
      posts.every((post) => `${postDocumentTitle(post)} | Run Without Stops`.length <= 60),
    ).toBe(true);
  });
});
