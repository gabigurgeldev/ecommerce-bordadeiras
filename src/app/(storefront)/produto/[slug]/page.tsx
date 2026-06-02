import { ProductGallery } from "@/components/shop/product-gallery";
import { BuyBox } from "@/components/shop/buy-box";
import { ProductGrid } from "@/components/shop/product-grid";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return buildMetadata({
    title: product.name,
    description: product.shortDescription ?? product.description,
    path: `/produto/${slug}`,
    image: product.images[0],
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLdScript data={productJsonLd(product)} />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Loja", path: "/loja" },
          { name: product.name, path: `/produto/${slug}` },
        ])}
      />
      <div className="grid gap-12 rounded-3xl border border-[var(--color-card-border)] bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-10">
        <ProductGallery images={product.images} name={product.name} />
        <div>
          <p className="text-sm uppercase tracking-wide text-rose-500">
            {product.categorySlug}
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-[var(--color-brown)]">
            {product.name}
          </h1>
          <div className="mt-8">
            <BuyBox product={product} />
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-[var(--color-brown)]">
            Relacionados
          </h2>
          <div className="mt-6">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
