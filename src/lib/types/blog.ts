/**
 * Blog domain types and helpers for API / data layer (Agent 2).
 * DB row types live in @/lib/types/database.
 */

export {
  BlogPostStatus,
  BlogMediaType,
  type BlogCategory,
  type BlogTag,
  type BlogPost,
  type BlogPostTag,
  type BlogComment,
  type BlogMedia,
  type BlogPostVersion,
  type BlogPostWithRelations,
} from "@/lib/types/database";

/** Fields accepted when creating/updating a post (API layer). */
export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  youtubeUrl?: string | null;
  status?: import("@/lib/types/database").BlogPostStatus;
  published?: boolean;
  publishedAt?: Date | string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  readingTime?: number | null;
  categoryId?: string | null;
  authorId?: string | null;
  tagIds?: string[];
};

/** Snapshot stored in BlogPostVersion on draft save. */
export type BlogPostVersionSnapshot = Omit<
  import("@/lib/types/database").BlogPostVersion,
  "id" | "postId" | "versionNumber" | "createdAt" | "createdById" | "notes"
>;

export type BlogCommentInput = {
  postId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  parentId?: string | null;
};

export type BlogMediaInput = {
  postId: string;
  type: import("@/lib/types/database").BlogMediaType;
  url: string;
  altText?: string | null;
  sortOrder?: number;
};

/** Column name mapping (spec → DB). */
export const BLOG_FIELD_ALIASES = {
  thumbnail: "coverImage",
  meta_title: "seoTitle",
  meta_description: "seoDescription",
  youtube_url: "youtubeUrl",
  reading_time: "readingTime",
  author_id: "authorId",
  category_id: "categoryId",
  posts_count: "postsCount",
  is_active: "isActive",
  order: "sortOrder",
} as const;

/** Default list filter: exclude soft-deleted posts. */
export const BLOG_ACTIVE_POST_FILTER = { deletedAt: null } as const;

/** Public storefront filter. */
export const BLOG_PUBLISHED_POST_FILTER = {
  status: "PUBLISHED" as const,
  deletedAt: null,
} as const;
