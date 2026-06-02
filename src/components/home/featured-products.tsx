import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { SectionHeader } from "@/components/home/section-header";
import { ProductGrid } from "@/components/shop/product-grid";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types/catalog";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function FeaturedProducts({ products }: { products: Product[] }) {
  const display = products.slice(0, 8);

  return (
    <section className="section-home section-divider gradient-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            subtitle="Seleção especial"
            title="Produtos em destaque"
            description="Selecionados para performance e acabamento profissional."
            action={
              <Button
                variant="outline"
                size="sm"
                className="group min-h-[44px]"
                asChild
              >
                <Link href="/loja">
                  Ver todos
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            }
          />
        </ScrollReveal>
        <ProductGrid products={display} />
      </div>
    </section>
  );
}
