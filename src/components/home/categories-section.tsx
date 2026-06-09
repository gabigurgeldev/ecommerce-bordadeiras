"use client";

import { ScrollReveal, Stagger, StaggerItem } from "@/components/animations/scroll-reveal";
import { SectionHeader } from "@/components/home/section-header";
import type { Category } from "@/lib/types/catalog";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Layers,
  Palette,
  Scissors,
  Settings2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function getCategoryIcon(slug: string): LucideIcon {
  if (slug.includes("maquina")) return Settings2;
  if (slug.includes("linha") || slug.includes("fio")) return Palette;
  if (slug.includes("acessor")) return Scissors;
  return Layers;
}

function CategoryCard({
  category,
  priority,
  className,
}: {
  category: Category;
  priority?: boolean;
  className?: string;
}) {
  const href = `/loja/categoria/${category.slug}`;
  const Icon = getCategoryIcon(category.slug);
  const hasCount = category.productCount != null && category.productCount > 0;

  return (
    <Link
      href={href}
      aria-label={`Ver categoria ${category.name}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-brown)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brown)] focus-visible:ring-offset-2",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--secondary)]">
        <Image
          src={category.imageUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width:768px) 80vw, (max-width:1280px) 50vw, 25vw"
          priority={priority}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--color-brown)]/55 via-transparent to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95"
          aria-hidden
        />
        {hasCount ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[var(--color-brown)] shadow-sm backdrop-blur">
            {category.productCount}{" "}
            {category.productCount === 1 ? "produto" : "produtos"}
          </span>
        ) : null}
      </div>

      <div className="category-card-caption flex flex-1 flex-col gap-2 border-t border-[var(--color-card-border)] bg-white p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--color-brown)] transition-transform duration-300 group-hover:scale-110"
            aria-hidden
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-semibold leading-snug text-[var(--color-brown)] sm:text-lg">
              {category.name}
            </h3>
            {category.description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-[var(--muted-foreground)] sm:text-sm">
                {category.description}
              </p>
            ) : null}
          </div>
        </div>
        <span className="link-underline mt-auto text-xs font-medium text-[var(--color-brown-muted)] transition-colors group-hover:text-[var(--color-brown)]">
          Ver categoria
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}

export function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section
      className="section-home section-divider bg-white"
      aria-labelledby="categories-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            titleId="categories-heading"
            subtitle="Categorias da loja"
            title="Máquinas, linhas e acessórios"
            description="Escolha uma categoria e veja os produtos disponíveis para o seu ateliê."
          />
        </ScrollReveal>

        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--color-card-border)] bg-[var(--secondary)]/40 px-6 py-12 text-center text-sm text-[var(--muted-foreground)]">
            Nenhuma categoria cadastrada ainda. Em breve você verá máquinas, linhas e
            acessórios aqui.
          </p>
        ) : (
          <Stagger
            as="ul"
            className={cn(
              "m-0 list-none p-0",
              "max-md:category-rail max-md:safe-bleed-x",
              "md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4",
            )}
          >
            {categories.map((category, index) => (
              <StaggerItem
                as="li"
                key={category.id}
                className={cn(
                  "max-md:w-[78%] max-md:min-w-[78%] max-md:shrink-0",
                  "sm:max-md:w-[48%] sm:max-md:min-w-[48%]",
                  "md:w-auto md:min-w-0",
                )}
              >
                <CategoryCard
                  category={category}
                  priority={index === 0}
                  className="h-full"
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}
