import type { BlogPostWithRelations, BlogCategory, BlogComment } from "@/lib/types/blog";

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type BlogPostListItem = BlogPostWithRelations;

export type BlogStats = {
  posts: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    scheduled: number;
    totalViews: number;
  };
  comments: {
    pending: number;
    approved: number;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    postsCount: number;
  }>;
};

export type BlogSitemapEntry = {
  slug: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type BlogCategorySitemapEntry = {
  slug: string;
  updatedAt: string;
};

export type BlogRssItem = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  publishedAt: string;
  categoryName: string | null;
};

export type BlogSearchResult = {
  posts: PaginatedResult<BlogPostListItem>;
  categories: PaginatedResult<BlogCategory>;
};

export type BlogCommentPublic = Pick<
  BlogComment,
  "id" | "postId" | "authorName" | "content" | "parentId" | "createdAt"
>;
