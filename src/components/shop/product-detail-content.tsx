"use client";

import { BuyBox } from "@/components/shop/buy-box";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductReviewsSection } from "@/components/shop/product-reviews-section";
import { sanitizeProductHtml } from "@/lib/sanitize";
import type {
  ProductReviewPublic,
  ProductReviewStats,
} from "@/lib/data/product-reviews";
import type { Product } from "@/lib/types/catalog";
import { useMemo, useState } from "react";

function ProductSectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-card-border)] bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-xl font-semibold text-[var(--color-brown)]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ProductDetailContent({
  product,
  categoryName,
  reviews,
  reviewStats,
  isLoggedIn,
  canReview,
  existingUserReview,
}: {
  product: Product;
  categoryName: string;
  reviews: ProductReviewPublic[];
  reviewStats: ProductReviewStats;
  isLoggedIn: boolean;
  canReview: boolean;
  existingUserReview: ProductReviewPublic | null;
}) {
  const [qty, setQty] = useState(1);

  const sanitizedDescription = useMemo(
    () => sanitizeProductHtml(product.description),
    [product.description],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-6">
            <ProductGallery
              images={product.images}
              videoUrls={product.videoUrls}
              name={product.name}
            />
          </div>

          <BuyBox
            product={product}
            categoryName={categoryName}
            quantity={qty}
            onQuantityChange={setQty}
          />
        </div>
      </div>

      {sanitizedDescription ? (
        <ProductSectionCard title="Descrição">
          <div
            className="prose prose-sm max-w-none text-[var(--color-brown-muted)] prose-headings:text-[var(--color-brown)] prose-strong:text-[var(--color-brown)] prose-a:text-[var(--color-cta)]"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        </ProductSectionCard>
      ) : null}

      <ProductReviewsSection
        productId={product.id}
        productSlug={product.slug}
        reviews={reviews}
        stats={reviewStats}
        isLoggedIn={isLoggedIn}
        canReview={canReview}
        existingUserReview={existingUserReview}
      />
    </div>
  );
}
