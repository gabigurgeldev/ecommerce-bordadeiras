import { ShopFilters } from "@/components/shop/shop-filters";
import { ProductGrid } from "@/components/shop/product-grid";
import { getProducts } from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo/metadata";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = buildMetadata({
  title: "Loja",
  description: "Máquinas de bordado, linhas e acessórios.",
  path: "/loja",
});

type SearchParams = Promise<{
  q?: string;
  sort?: string;
  category?: string;
}>;

export default async function LojaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const products = await getProducts({
    q: params.q,
    sort: (params.sort as "price-asc") ?? "newest",
    categorySlug: params.category,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold text-[var(--color-brown)]">
        Loja
      </h1>
      <p className="mt-2 text-[var(--muted-foreground)]">Todos os produtos</p>
      <div className="mt-8 rounded-2xl border border-[var(--color-card-border)] bg-white p-1 shadow-sm">
        <Suspense fallback={<Skeleton className="h-20 w-full" />}>
          <ShopFilters />
        </Suspense>
      </div>
      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
