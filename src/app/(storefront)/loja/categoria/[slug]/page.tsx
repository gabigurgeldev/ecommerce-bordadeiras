import { ProductGrid } from "@/components/shop/product-grid";
import { getCategoryBySlug } from "@/lib/data/categories";
import { getProducts } from "@/lib/data/products";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return buildMetadata({
    title: category.name,
    description: category.description,
    path: `/loja/categoria/${slug}`,
    image: category.imageUrl,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProducts({ categorySlug: slug });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Loja", path: "/loja" },
          { name: category.name, path: `/loja/categoria/${slug}` },
        ])}
      />
      <h1 className="font-display text-4xl font-semibold text-white">
        {category.name}
      </h1>
      <p className="mt-2 text-zinc-400">{category.description}</p>
      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
