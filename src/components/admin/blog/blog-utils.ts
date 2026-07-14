import type { BlogPostWithRelations } from "@/lib/types/database";

export type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  youtubeUrl: string | null;
  status: string;
  published: boolean;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  views: number;
  readingTime: number | null;
  categoryId: string | null;
  categoryName: string | null;
  authorName: string | null;
  tagIds: string[];
  updatedAt: string;
  createdAt: string;
};

export function mapPostRow(post: BlogPostWithRelations | Record<string, unknown>): BlogPostRow {
  const row = post as BlogPostWithRelations;
  const category = row.category ?? (post as Record<string, unknown>).BlogCategory as { name?: string } | null;
  const author = row.author ?? (post as Record<string, unknown>).User as { name?: string } | null;
  const postTags = row.tags ?? (post as Record<string, unknown>).BlogPostTag as Array<{
    tag?: { id: string };
    BlogTag?: { id: string };
  }> | undefined;

  const tagIds = (postTags ?? [])
    .map((pt) => {
      const withTag = pt as { tag?: { id: string }; BlogTag?: { id: string } };
      return withTag.tag?.id ?? withTag.BlogTag?.id;
    })
    .filter((id): id is string => Boolean(id));

  const toIso = (d: Date | string | null | undefined) =>
    d ? (d instanceof Date ? d.toISOString() : String(d)) : null;

  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    excerpt: row.excerpt ?? null,
    content: String(row.content),
    coverImage: row.coverImage ?? null,
    youtubeUrl: row.youtubeUrl ?? null,
    status: String(row.status ?? (row.published ? "PUBLISHED" : "DRAFT")),
    published: Boolean(row.published),
    publishedAt: toIso(row.publishedAt),
    seoTitle: row.seoTitle ?? null,
    seoDescription: row.seoDescription ?? null,
    views: Number(row.views ?? 0),
    readingTime: row.readingTime ?? null,
    categoryId: row.categoryId ?? null,
    categoryName: category?.name ?? null,
    authorName: author?.name ?? null,
    tagIds,
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
  };
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function countWords(html: string): number {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function estimateReadingTime(html: string): number {
  const words = countWords(html);
  return Math.max(1, Math.ceil(words / 200));
}

export function computeSeoScore(params: {
  title: string;
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  content: string;
  coverImage: string;
}): { score: number; tips: string[] } {
  let score = 0;
  const tips: string[] = [];

  const metaTitle = params.seoTitle || params.title;
  if (metaTitle.length >= 30 && metaTitle.length <= 60) score += 25;
  else tips.push("Meta título ideal: 30–60 caracteres");

  const metaDesc = params.seoDescription || params.excerpt;
  if (metaDesc.length >= 120 && metaDesc.length <= 160) score += 25;
  else if (metaDesc.length >= 70) score += 15;
  else tips.push("Meta descrição ideal: 120–160 caracteres");

  if (params.title.length >= 10) score += 15;
  else tips.push("Título muito curto");

  const words = countWords(params.content);
  if (words >= 300) score += 20;
  else if (words >= 150) score += 10;
  else tips.push("Conteúdo curto — ideal acima de 300 palavras");

  if (params.coverImage.trim()) score += 15;
  else tips.push("Adicione imagem de destaque");

  return { score: Math.min(100, score), tips };
}

export function aggregateByDate(
  items: Array<{ date: string; value?: number }>,
  days = 30,
): Array<{ date: string; count: number; views: number }> {
  const map = new Map<string, { count: number; views: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { count: 0, views: 0 });
  }
  for (const item of items) {
    if (!item.date) continue;
    const key = item.date.slice(0, 10);
    const entry = map.get(key);
    if (entry) {
      entry.count += 1;
      entry.views += item.value ?? 0;
    }
  }
  return Array.from(map.entries()).map(([date, v]) => ({
    date,
    count: v.count,
    views: v.views,
  }));
}
