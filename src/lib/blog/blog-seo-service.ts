import { siteConfig } from "@/lib/site";
import type { BlogPostWithRelations } from "@/lib/types/database";
import type { BlogRssItem, BlogSitemapEntry, BlogCategorySitemapEntry } from "@/lib/blog/types";
import { getDb, TABLES } from "@/lib/supabase/db";
import { BlogPostStatus } from "@/lib/types/database";

const SITE_NAME = siteConfig.name;
const MAX_TITLE = 70;
const MAX_DESCRIPTION = 160;

export function buildBlogMetaTags(post: BlogPostWithRelations) {
  const title = (post.seoTitle || post.title).slice(0, MAX_TITLE);
  const description = (
    post.seoDescription ||
    post.excerpt ||
    stripHtml(post.content).slice(0, MAX_DESCRIPTION)
  ).slice(0, MAX_DESCRIPTION);

  const image = post.coverImage || undefined;
  const url = `${siteConfig.url}/blog/${post.slug}`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article" as const,
      // publishedAt/updatedAt podem chegar como string quando o post volta do
      // unstable_cache (JSON serializa os Date). Normaliza antes de formatar.
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: image ? [image] : [],
    },
    canonical: url,
  };
}

export function autoGenerateSeoFields(post: {
  title: string;
  excerpt?: string | null;
  content: string;
}) {
  const plain = stripHtml(post.content);
  return {
    seoTitle: post.title.slice(0, MAX_TITLE),
    seoDescription: (post.excerpt || plain).slice(0, MAX_DESCRIPTION),
  };
}

export async function getBlogSitemapEntries(): Promise<BlogSitemapEntry[]> {
  const { data, error } = await getDb()
    .from(TABLES.BlogPost)
    .select("slug, updatedAt, publishedAt")
    .eq("status", BlogPostStatus.PUBLISHED)
    .is("deletedAt", null)
    .order("publishedAt", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    slug: String(row.slug),
    updatedAt: new Date(String(row.updatedAt)).toISOString(),
    publishedAt: row.publishedAt ? new Date(String(row.publishedAt)).toISOString() : null,
  }));
}

export async function getBlogCategorySitemapEntries(): Promise<BlogCategorySitemapEntry[]> {
  const { data, error } = await getDb()
    .from(TABLES.BlogCategory)
    .select("slug, updatedAt")
    .eq("isActive", true)
    .gt("postsCount", 0)
    .order("sortOrder", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    slug: String(row.slug),
    updatedAt: new Date(String(row.updatedAt)).toISOString(),
  }));
}

export async function getBlogRssItems(limit = 50): Promise<BlogRssItem[]> {
  const { data, error } = await getDb()
    .from(TABLES.BlogPost)
    .select("title, slug, excerpt, content, coverImage, publishedAt, BlogCategory(name)")
    .eq("status", BlogPostStatus.PUBLISHED)
    .is("deletedAt", null)
    .order("publishedAt", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const category = row.BlogCategory as { name?: string } | null;
    return {
      title: String(row.title),
      slug: String(row.slug),
      excerpt: row.excerpt ? String(row.excerpt) : null,
      content: String(row.content),
      coverImage: row.coverImage ? String(row.coverImage) : null,
      publishedAt: new Date(String(row.publishedAt)).toISOString(),
      categoryName: category?.name ?? null,
    };
  });
}

export function buildRssXml(items: BlogRssItem[]): string {
  const channelLink = `${siteConfig.url}/blog`;
  const now = new Date().toUTCString();

  const itemXml = items
    .map((item) => {
      const link = `${siteConfig.url}/blog/${item.slug}`;
      const pubDate = new Date(item.publishedAt).toUTCString();
      const description = escapeXml(item.excerpt || stripHtml(item.content).slice(0, 300));
      const category = item.categoryName
        ? `<category>${escapeXml(item.categoryName)}</category>`
        : "";

      const enclosure = item.coverImage
        ? `<enclosure url="${escapeXml(item.coverImage)}" type="image/jpeg" length="0"/>`
        : "";

      return `<item>
  <title>${escapeXml(item.title)}</title>
  <link>${link}</link>
  <guid isPermaLink="true">${link}</guid>
  <pubDate>${pubDate}</pubDate>
  <description>${description}</description>
  ${category}
  ${enclosure}
</item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(SITE_NAME)} — Blog</title>
  <link>${channelLink}</link>
  <description>${escapeXml(siteConfig.description)}</description>
  <language>pt-BR</language>
  <lastBuildDate>${now}</lastBuildDate>
  <atom:link href="${siteConfig.url}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${itemXml}
</channel>
</rss>`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
