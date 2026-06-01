import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/lib/types/catalog";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="col-span-full py-16 text-center text-zinc-500">
        Nenhum produto encontrado.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
