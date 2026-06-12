import { parseDate } from "@/lib/supabase/db";
import type {
  BlogCategory,
  BlogComment,
  BlogMedia,
  BlogPost,
  BlogPostVersion,
  BlogPostWithRelations,
  BlogTag,
} from "@/lib/types/database";

function parseOptionalDate(v: unknown): Date | null {
  if (v == null) return null;
  return parseDate(v);
}

export function mapBlogPostRow(row: Record<string, unknown>): BlogPost {
  return {
    ...(row as unknown as BlogPost),
    createdAt: new Date(String(row.createdAt)),
    updatedAt: new Date(String(row.updatedAt)),
    publishedAt: parseOptionalDate(row.publishedAt),
    deletedAt: parseOptionalDate(row.deletedAt),
  };
}

export function mapBlogCategoryRow(row: Record<string, unknown>): BlogCategory {
  return {
    ...(row as unknown as BlogCategory),
    createdAt: new Date(String(row.createdAt)),
    updatedAt: new Date(String(row.updatedAt)),
  };
}

export function mapBlogCommentRow(row: Record<string, unknown>): BlogComment {
  return {
    ...(row as unknown as BlogComment),
    createdAt: new Date(String(row.createdAt)),
  };
}

export function mapBlogMediaRow(row: Record<string, unknown>): BlogMedia {
  return {
    ...(row as unknown as BlogMedia),
    createdAt: new Date(String(row.createdAt)),
  };
}

export function mapBlogPostVersionRow(row: Record<string, unknown>): BlogPostVersion {
  return {
    ...(row as unknown as BlogPostVersion),
    createdAt: new Date(String(row.createdAt)),
  };
}

export function mapBlogPostWithRelations(row: Record<string, unknown>): BlogPostWithRelations {
  const post = mapBlogPostRow(row);
  const categoryRaw = (row.BlogCategory ?? row.category) as Record<string, unknown> | null;
  const tagRows = (row.BlogPostTag ?? row.tags) as Record<string, unknown>[] | undefined;
  const mediaRows = (row.BlogMedia ?? row.media) as Record<string, unknown>[] | undefined;
  const commentRows = (row.BlogComment ?? row.comments) as Record<string, unknown>[] | undefined;
  const versionRows = (row.BlogPostVersion ?? row.versions) as
    | Record<string, unknown>[]
    | undefined;

  return {
    ...post,
    category: categoryRaw ? mapBlogCategoryRow(categoryRaw) : null,
    tags: Array.isArray(tagRows)
      ? tagRows.map((t) => {
          const tagRaw = (t.BlogTag ?? t.tag) as Record<string, unknown> | undefined;
          return {
            postId: String(t.postId),
            tagId: String(t.tagId),
            ...(tagRaw
              ? {
                  tag: {
                    ...(tagRaw as unknown as BlogTag),
                    createdAt: new Date(String(tagRaw.createdAt)),
                  },
                }
              : {}),
          };
        })
      : undefined,
    media: Array.isArray(mediaRows) ? mediaRows.map(mapBlogMediaRow) : undefined,
    comments: Array.isArray(commentRows) ? commentRows.map(mapBlogCommentRow) : undefined,
    versions: Array.isArray(versionRows) ? versionRows.map(mapBlogPostVersionRow) : undefined,
  };
}
