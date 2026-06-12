"use client";

import { useEffect } from "react";
import { trackBlogPostView } from "@/actions/blog";

export function BlogViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    void trackBlogPostView(slug);
  }, [slug]);

  return null;
}
