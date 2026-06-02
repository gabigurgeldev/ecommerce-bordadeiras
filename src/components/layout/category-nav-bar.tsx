"use client";

import { formatCurrency } from "@/lib/format";
import type { Category, Product } from "@/lib/types/catalog";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type CategoryPreview = {
  category: Category;
  products: Product[];
};

function PreviewProduct({ product }: { product: Product }) {
  const image = product.images[0];
  if (!image) return null;

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex gap-3 rounded-lg p-2 transition hover:bg-[var(--secondary)]"
    >
      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--secondary)]">
        <Image
          src={image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-[var(--color-brown)] group-hover:underline">
          {product.name}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[var(--color-price)]">
          {formatCurrency(product.priceCents)}
        </p>
      </div>
    </Link>
  );
}

function CategoryDropdown({
  preview,
  open,
  onClose,
}: {
  preview: CategoryPreview;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const { category, products } = preview;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 hidden lg:block"
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute left-0 top-full z-50 mt-0 w-[min(100vw-2rem,22rem)] rounded-b-xl border border-[var(--color-card-border)] bg-white p-3 shadow-xl",
          "lg:left-1/2 lg:w-[min(100vw-2rem,28rem)] lg:-translate-x-1/2",
        )}
      >
        {products.length > 0 ? (
          <ul className="space-y-0.5">
            {products.map((product) => (
              <li key={product.id}>
                <PreviewProduct product={product} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-3 text-sm text-[var(--color-brown-muted)]">
            Nenhum produto nesta categoria.
          </p>
        )}
        <Link
          href={`/loja/categoria/${category.slug}`}
          onClick={onClose}
          className="mt-2 block rounded-lg px-2 py-2 text-center text-sm font-semibold text-[var(--color-brown)] hover:bg-[var(--secondary)]"
        >
          Ver todos em {category.name}
        </Link>
      </div>
    </>
  );
}

export function CategoryNavBar({ previews }: { previews: CategoryPreview[] }) {
  const pathname = usePathname();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [mobileOpenSlug, setMobileOpenSlug] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setActiveSlug(null);
    setMobileOpenSlug(null);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!navRef.current?.contains(e.target as Node)) {
        setActiveSlug(null);
        setMobileOpenSlug(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  if (previews.length === 0) return null;

  return (
    <nav
      ref={navRef}
      className="border-b border-[var(--color-card-border)] bg-[var(--color-header-bg)]"
      aria-label="Categorias"
    >
      <div className="mx-auto min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="flex min-w-0 items-stretch gap-0 overflow-x-auto overscroll-x-contain scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <li className="shrink-0">
            <Link
              href="/loja"
              className={cn(
                "inline-flex items-center px-4 py-3 text-sm font-semibold text-[var(--color-brown)] transition hover:bg-[var(--secondary)]",
                pathname === "/loja" && "bg-[var(--secondary)]",
              )}
            >
              Todos
            </Link>
          </li>
          {previews.map((preview) => {
            const { category } = preview;
            const href = `/loja/categoria/${category.slug}`;
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            const desktopOpen = activeSlug === category.slug;
            const mobileOpen = mobileOpenSlug === category.slug;

            return (
              <li key={category.id} className="relative shrink-0">
                <div className="flex items-stretch">
                  <Link
                    href={href}
                    className={cn(
                      "inline-flex items-center px-4 py-3 text-sm font-medium text-[var(--color-brown)] transition hover:bg-[var(--secondary)]",
                      isActive && "bg-[var(--secondary)] font-semibold",
                    )}
                  >
                    {category.name}
                  </Link>
                  <button
                    type="button"
                    className="inline-flex items-center px-1.5 text-[var(--color-brown-muted)] transition hover:bg-[var(--secondary)] hover:text-[var(--color-brown)] lg:px-2"
                    aria-expanded={desktopOpen || mobileOpen}
                    aria-label={`Ver produtos de ${category.name}`}
                    onMouseEnter={() => setActiveSlug(category.slug)}
                    onFocus={() => setActiveSlug(category.slug)}
                    onClick={() =>
                      setMobileOpenSlug((s) =>
                        s === category.slug ? null : category.slug,
                      )
                    }
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition",
                        (desktopOpen || mobileOpen) && "rotate-180",
                      )}
                    />
                  </button>
                </div>
                <div className="hidden lg:block">
                  <CategoryDropdown
                    preview={preview}
                    open={desktopOpen}
                    onClose={() => setActiveSlug(null)}
                  />
                </div>
                <div className="lg:hidden">
                  {mobileOpen && (
                    <div className="absolute left-0 top-full z-50 w-[min(100vw-2rem,20rem)] rounded-b-xl border border-[var(--color-card-border)] bg-white p-3 shadow-xl">
                      {preview.products.length > 0 ? (
                        <ul className="space-y-0.5">
                          {preview.products.map((product) => (
                            <li key={product.id}>
                              <PreviewProduct product={product} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="px-2 py-3 text-sm text-[var(--color-brown-muted)]">
                          Nenhum produto nesta categoria.
                        </p>
                      )}
                      <Link
                        href={href}
                        onClick={() => setMobileOpenSlug(null)}
                        className="mt-2 block rounded-lg px-2 py-2 text-center text-sm font-semibold text-[var(--color-brown)] hover:bg-[var(--secondary)]"
                      >
                        Ver todos
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
