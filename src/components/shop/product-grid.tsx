import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/lib/types/catalog";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  className,
}: {
  products: Product[];
  className?: string;
}) {
  if (products.length === 0) {
    return (
      <p className="col-span-full py-12 text-center text-[var(--muted-foreground)]">
        Nenhum produto encontrado.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}
