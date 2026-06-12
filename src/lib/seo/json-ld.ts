import { siteConfig } from "@/lib/site";
import type { BlogPost, Product } from "@/lib/types/catalog";
import type { ProductReviewStats } from "@/lib/data/product-reviews";
import type { BlogPostWithRelations } from "@/lib/types/database";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.legalName,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.contact.phone,
      contactType: "customer service",
      areaServed: "BR",
      availableLanguage: "Portuguese",
    },
  };
}

export function productJsonLd(product: Product, reviewStats?: ProductReviewStats) {
  const base = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      url: `${siteConfig.url}/produto/${product.slug}`,
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  if (reviewStats && reviewStats.count > 0) {
    return {
      ...base,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: reviewStats.averageRating.toFixed(1),
        reviewCount: reviewStats.count,
        bestRating: 5,
        worstRating: 1,
      },
    };
  }

  return base;
}

export function blogPostJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: `${siteConfig.url}/brand/logo.png` },
    },
  };
}

export function blogArticleJsonLd(
  post: BlogPostWithRelations,
  options?: { coverImage?: string; authorName?: string },
) {
  const url = `${siteConfig.url}/blog/${post.slug}`;
  const cover = options?.coverImage ?? post.coverImage ?? undefined;
  const authorName = options?.authorName ?? post.author?.name?.trim() ?? "Equipe Bordadeiras";

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    image: cover,
    datePublished: post.publishedAt?.toISOString?.() ?? post.publishedAt ?? undefined,
    dateModified: post.updatedAt?.toISOString?.() ?? post.updatedAt ?? undefined,
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: `${siteConfig.url}/brand/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    ...(post.category
      ? { articleSection: post.category.name, keywords: post.tags?.map((t) => t.tag?.name).filter(Boolean) }
      : {}),
  };
}

export function blogListingJsonLd(options: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: options.name,
    description: options.description,
    url: `${siteConfig.url}${options.path}`,
    isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  };
}
