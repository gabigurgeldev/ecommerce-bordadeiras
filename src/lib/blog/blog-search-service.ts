import { listBlogPosts } from "@/lib/blog/blog-post-service";
import { listBlogCategories } from "@/lib/blog/blog-category-service";
import type { BlogSearchResult } from "@/lib/blog/types";
import type { BlogSearchQuery } from "@/lib/validations/blog";

export async function searchBlog(params: BlogSearchQuery): Promise<BlogSearchResult> {
  const q = params.q.trim();

  const emptyPosts = {
    items: [],
    total: 0,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: 1,
  };
  const emptyCategories = {
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };

  if (params.type === "posts") {
    const posts = await listBlogPosts({
      page: params.page,
      pageSize: params.pageSize,
      search: q,
      sortBy: "publishedAt",
      sortOrder: "desc",
      publicOnly: true,
      includeDeleted: false,
    });
    return { posts, categories: emptyCategories };
  }

  if (params.type === "categories") {
    const categories = await listBlogCategories({
      page: params.page,
      pageSize: params.pageSize,
      search: q,
      activeOnly: true,
      sortBy: "name",
      sortOrder: "asc",
    });
    return { posts: emptyPosts, categories };
  }

  const [posts, categories] = await Promise.all([
    listBlogPosts({
      page: params.page,
      pageSize: params.pageSize,
      search: q,
      sortBy: "publishedAt",
      sortOrder: "desc",
      publicOnly: true,
      includeDeleted: false,
    }),
    listBlogCategories({
      page: 1,
      pageSize: 10,
      search: q,
      activeOnly: true,
      sortBy: "name",
      sortOrder: "asc",
    }),
  ]);

  return { posts, categories };
}
