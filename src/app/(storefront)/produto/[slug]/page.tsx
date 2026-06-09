import { ProductDetailContent } from "@/components/shop/product-detail-content";
import { ProductGrid } from "@/components/shop/product-grid";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCategoryBySlug } from "@/lib/data/categories";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return buildMetadata({
    title: product.seoTitle ?? product.name,
    description:
      product.seoDescription ??
      product.shortDescription ??
      product.description.replace(/<[^>]+>/g, " "),
    path: `/produto/${slug}`,
    image: product.images[0],
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, related] = await Promise.all([
    getCategoryBySlug(product.categorySlug),
    getRelatedProducts(product),
  ]);

  const categoryName = category?.name ?? product.categorySlug;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <JsonLdScript data={productJsonLd(product)} />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Página inicial", path: "/" },
          { name: categoryName, path: `/loja/categoria/${product.categorySlug}` },
          { name: product.name, path: `/produto/${slug}` },
        ])}
      />

      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link
              href="/"
              className="transition-colors hover:text-[var(--color-brown)] text-[var(--muted-foreground)]"
            >
              Página inicial
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link
              href={`/loja/categoria/${product.categorySlug}`}
              className="transition-colors hover:text-[var(--color-brown)] text-[var(--muted-foreground)]"
            >
              {categoryName}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1 text-[var(--color-brown)]">
              {product.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ProductDetailContent product={product} categoryName={categoryName} />

      {related.length > 0 ? (
        <section className="mt-12 sm:mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-cta)]">
                Descubra mais
              </p>
              <h2 className="font-display mt-1 text-2xl font-semibold text-[var(--color-brown)] sm:text-3xl">
                Talvez você goste
              </h2>
            </div>
          </div>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </div>
  );
}
