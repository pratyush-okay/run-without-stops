"use client";

import { useEffect } from "react";

function allowIndexing() {
  for (const meta of document.querySelectorAll('meta[name="robots"], meta[name="googlebot"]')) {
    const content = meta.getAttribute("content") ?? "";
    if (/noindex/i.test(content)) {
      meta.setAttribute("content", "index, follow");
    }
  }
}

/** Clerk development instances inject noindex. Keep the public homepage indexable. */
export function AllowPublicIndexing() {
  useEffect(() => {
    allowIndexing();
    const observer = new MutationObserver(allowIndexing);
    observer.observe(document.head, { childList: true, subtree: true, attributes: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
