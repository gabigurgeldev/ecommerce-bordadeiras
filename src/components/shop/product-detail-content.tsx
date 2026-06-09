"use client";

import { BuyBox } from "@/components/shop/buy-box";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductShippingCalculator } from "@/components/shop/product-shipping-calculator";
import { VideoGallery } from "@/components/shop/video-gallery";
import { sanitizeProductHtml } from "@/lib/sanitize";
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
}: {
  product: Product;
  categoryName: string;
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
            <ProductGallery images={product.images} name={product.name} />
            {product.videoUrls?.length > 0 ? (
              <VideoGallery videoUrls={product.videoUrls} />
            ) : null}
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

      {product.specs && Object.keys(product.specs).length > 0 ? (
        <ProductSectionCard title="Especificações">
          <dl className="grid gap-3 sm:grid-cols-2">
            {Object.entries(product.specs).map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-[var(--color-card-border)] bg-[var(--secondary)]/50 px-4 py-3"
              >
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  {key}
                </dt>
                <dd className="mt-1 text-sm font-medium text-[var(--color-brown)]">{value}</dd>
              </div>
            ))}
          </dl>
        </ProductSectionCard>
      ) : null}

      <ProductSectionCard title="Entrega">
        <ProductShippingCalculator productId={product.id} quantity={qty} />
      </ProductSectionCard>
    </div>
  );
}
