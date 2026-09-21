import {
  isDocumentTitleLength,
  isMetaDescriptionLength,
  withBrandTitle,
} from "@/lib/seo/meta-length";
import {
  BLOG_INDEX_DESCRIPTION,
  BLOG_INDEX_TITLE,
  TERMS_DESCRIPTION,
  TERMS_TITLE,
} from "@/lib/seo/public-copy";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo/site";

describe("search snippet lengths", () => {
  it("keeps public document titles in the 50-60 character window", () => {
    expect(isDocumentTitleLength(SITE_TITLE)).toBe(true);
    expect(isDocumentTitleLength(withBrandTitle(BLOG_INDEX_TITLE))).toBe(true);
    expect(isDocumentTitleLength(withBrandTitle(TERMS_TITLE))).toBe(true);
  });

  it("keeps public meta descriptions in the 150-160 character window", () => {
    expect(isMetaDescriptionLength(SITE_DESCRIPTION)).toBe(true);
    expect(isMetaDescriptionLength(BLOG_INDEX_DESCRIPTION)).toBe(true);
    expect(isMetaDescriptionLength(TERMS_DESCRIPTION)).toBe(true);
  });

  it("rejects titles that are still too short for search snippets", () => {
    expect(isDocumentTitleLength("Run Planner | Run Without Stops")).toBe(false);
  });
});
