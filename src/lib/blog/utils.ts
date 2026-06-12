import { slugify } from "@/lib/utils";
import type { PaginatedResult } from "@/lib/blog/types";

const WORDS_PER_MINUTE = 200;

/** Estimate reading time in minutes from HTML or plain text content. */
export function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export async function generateUniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = slugify(base);
  if (!slug) slug = "post";

  if (!(await isTaken(slug))) return slug;

  for (let i = 2; i <= 50; i++) {
    const candidate = `${slug}-${i}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  return `${slug}-${Date.now()}`;
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function parseListRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

export function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
