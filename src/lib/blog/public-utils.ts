import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from "@/lib/blog/youtube-service";
import { siteConfig } from "@/lib/site";
import type { BlogPostWithRelations } from "@/lib/types/database";

export const BLOG_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1606771689789-7b41f7d3c7a3?w=800&q=80";

export type PublicBlogPost = BlogPostWithRelations;

export function getPostCoverImage(post: Pick<PublicBlogPost, "coverImage" | "youtubeUrl">): string {
  if (post.coverImage) return post.coverImage;
  if (post.youtubeUrl) {
    const id = extractYouTubeVideoId(post.youtubeUrl);
    if (id) return getYouTubeThumbnailUrl(id);
  }
  return BLOG_PLACEHOLDER_IMAGE;
}

export function getAuthorName(post: PublicBlogPost): string {
  return post.author?.name?.trim() || "Equipe Bordadeiras";
}

export function getAuthorAvatarUrl(post: PublicBlogPost): string | null {
  return post.author?.image ?? null;
}

export function getPostTags(post: PublicBlogPost): string[] {
  return (post.tags ?? [])
    .map((t) => t.tag?.name)
    .filter((name): name is string => Boolean(name));
}

export function formatReadingTime(minutes: number | null | undefined): string {
  const mins = minutes && minutes > 0 ? minutes : 1;
  return `${mins} min de leitura`;
}

export function formatViewCount(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1).replace(".0", "")}k`;
  return String(views);
}

const AVATAR_COLORS = [
  "bg-[var(--color-cta)]",
  "bg-[var(--color-green)]",
  "bg-[var(--color-price)]",
  "bg-[#8B6914]",
  "bg-[#6B4423]",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

export type TocHeading = { id: string; text: string; level: 2 | 3 };

export function extractHeadingsFromHtml(html: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const regex = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const level = Number(match[1]) as 2 | 3;
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    if (!text) continue;
    const id = slugifyHeading(text);
    headings.push({ id, text, level });
  }
  return headings;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function injectHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (_full, level, attrs, inner) => {
    const text = String(inner).replace(/<[^>]+>/g, "").trim();
    const id = slugifyHeading(text);
    if (!id) return `<h${level}${attrs}>${inner}</h${level}>`;
    if (String(attrs).includes('id="')) return `<h${level}${attrs}>${inner}</h${level}>`;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}

/** Adds native lazy-loading to inline article images without an existing loading attribute. */
export function addLazyLoadingToContentImages(html: string): string {
  return html.replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async"');
}

export function prepareArticleHtml(html: string): string {
  return addLazyLoadingToContentImages(injectHeadingIds(html));
}

export function highlightSearchTerms(text: string, query: string): string {
  const q = query.trim();
  if (!q || q.length < 2) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.replace(regex, "<mark class=\"rounded bg-[var(--color-price)]/25 px-0.5\">$1</mark>");
}

export function buildShareUrls(url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
}

export function getPostShareUrl(slug: string): string {
  return `${siteConfig.url}/blog/${slug}`;
}

export function collectTagsFromPosts(posts: PublicBlogPost[]): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of getPostTags(post)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function filterPostsByPeriod(
  posts: PublicBlogPost[],
  period: "all" | "week" | "month" | "year",
): PublicBlogPost[] {
  if (period === "all") return posts;
  const now = Date.now();
  const days = period === "week" ? 7 : period === "month" ? 30 : 365;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return posts.filter((p) => {
    if (!p.publishedAt) return false;
    const date = p.publishedAt instanceof Date ? p.publishedAt : new Date(String(p.publishedAt));
    return date.getTime() >= cutoff;
  });
}
