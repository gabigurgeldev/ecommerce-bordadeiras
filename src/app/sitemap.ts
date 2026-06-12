import type { MetadataRoute } from "next";
import {
  getBlogCategorySitemapEntries,
  getBlogSitemapEntries,
} from "@/lib/blog/blog-seo-service";
import { getCategories } from "@/lib/data/categories";
import { getProducts } from "@/lib/data/products";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

const STATIC_ROUTES: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/loja", changeFrequency: "daily", priority: 0.9 },
  { path: "/blog", changeFrequency: "daily", priority: 0.9 },
  { path: "/contato", changeFrequency: "monthly", priority: 0.5 },
  { path: "/sobre", changeFrequency: "monthly", priority: 0.5 },
  { path: "/termos", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacidade", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  let blogPosts: Awaited<ReturnType<typeof getBlogSitemapEntries>> = [];
  let blogCategories: Awaited<ReturnType<typeof getBlogCategorySitemapEntries>> = [];
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let shopCategories: Awaited<ReturnType<typeof getCategories>> = [];

  try {
    [blogPosts, blogCategories, products, shopCategories] = await Promise.all([
      getBlogSitemapEntries(),
      getBlogCategorySitemapEntries(),
      getProducts({ sort: "newest" }),
      getCategories(),
    ]);
  } catch (e) {
    console.error("[sitemap]", e);
  }

  const blogPostEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogCategoryEntries: MetadataRoute.Sitemap = blogCategories.map((cat) => ({
    url: `${base}/blog/categoria/${cat.slug}`,
    lastModified: new Date(cat.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}/produto/${product.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const shopCategoryEntries: MetadataRoute.Sitemap = shopCategories.map((cat) => ({
    url: `${base}/loja/categoria/${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...blogPostEntries,
    ...blogCategoryEntries,
    ...productEntries,
    ...shopCategoryEntries,
  ];
}
