import { mapBlogPost, parseBlogPostRow } from "@/lib/data/mappers";
import { mockBlogPosts } from "@/lib/mock/catalog";
import { getDb, TABLES } from "@/lib/supabase/db";
import type { BlogPost } from "@/lib/types/catalog";

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await getDb()
      .from(TABLES.BlogPost)
      .select("*")
      .eq("published", true)
      .order("publishedAt", { ascending: false });
    if (!error && data?.length) {
      return data.map((p) => mapBlogPost(parseBlogPostRow(p as Record<string, unknown>)));
    }
  } catch {
    /* mock fallback */
  }
  return [...mockBlogPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await getDb()
      .from(TABLES.BlogPost)
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (!error && data) {
      return mapBlogPost(parseBlogPostRow(data as Record<string, unknown>));
    }
  } catch {
    /* mock fallback */
  }
  return mockBlogPosts.find((p) => p.slug === slug) ?? null;
}
