import { describe, expect, it } from "vitest";
import { buildBlogMetaTags } from "@/lib/blog/blog-seo-service";
import type { BlogPostWithRelations } from "@/lib/types/database";

function makePost(overrides: Partial<BlogPostWithRelations>) {
  return {
    id: "post-1",
    title: "Bordado livre",
    slug: "bordado-livre",
    content: "<p>conteúdo</p>",
    excerpt: "resumo",
    seoTitle: null,
    seoDescription: null,
    coverImage: null,
    publishedAt: new Date("2026-01-02T03:04:05.000Z"),
    updatedAt: new Date("2026-02-03T04:05:06.000Z"),
    ...overrides,
  } as unknown as BlogPostWithRelations;
}

describe("buildBlogMetaTags", () => {
  it("normalizes dates that come back as strings from the cache", () => {
    const meta = buildBlogMetaTags(
      makePost({
        publishedAt: "2026-01-02T03:04:05.000Z" as unknown as Date,
        updatedAt: "2026-02-03T04:05:06.000Z" as unknown as Date,
      }),
    );
    expect(meta.openGraph.publishedTime).toBe("2026-01-02T03:04:05.000Z");
    expect(meta.openGraph.modifiedTime).toBe("2026-02-03T04:05:06.000Z");
  });

  it("omits a null publishedAt instead of throwing", () => {
    const meta = buildBlogMetaTags(
      makePost({ publishedAt: null as unknown as Date }),
    );
    expect(meta.openGraph.publishedTime).toBeUndefined();
  });

  it("omits an unparseable date instead of throwing", () => {
    const meta = buildBlogMetaTags(
      makePost({ publishedAt: "not-a-date" as unknown as Date }),
    );
    expect(meta.openGraph.publishedTime).toBeUndefined();
  });
});
