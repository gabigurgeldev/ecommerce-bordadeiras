import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { ProductGrid } from "@/components/shop/product-grid";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types/catalog";
import Link from "next/link";

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="bg-zinc-50 py-20 dark:bg-zinc-900/50" data-gsap-fade>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Produtos em destaque
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Selecionados para performance e acabamento profissional.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/loja">Ver todos</Link>
          </Button>
        </ScrollReveal>
        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      </div>
    </section>
  );
}
