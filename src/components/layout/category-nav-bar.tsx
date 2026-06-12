"use client";

import type { Category, Product } from "@/lib/types/catalog";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export type CategoryPreview = {
  category: Category;
  products: Product[];
};

const HOVER_CLOSE_DELAY_MS = 200;
const HOVER_MQ = "(hover: hover) and (pointer: fine)";

function ProductTextLinks({
  products,
  categoryHref,
  onNavigate,
}: {
  products: Product[];
  categoryHref: string;
  onNavigate?: () => void;
}) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-[var(--color-brown-muted)]">
        Nenhum produto nesta categoria.{" "}
        <Link
          href={categoryHref}
          onClick={onNavigate}
          className="font-medium text-[var(--color-brown)] underline-offset-2 hover:underline"
        >
          Ver categoria
        </Link>
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {products.map((product) => (
        <li key={product.id}>
          <Link
            href={`/produto/${product.slug}`}
            onClick={onNavigate}
            className="block py-1.5 text-sm text-[var(--color-brown)] transition hover:text-[var(--color-cta)] hover:underline"
          >
            {product.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function HoverMegamenuPanel({
  preview,
  onClose,
  animateIn,
  isFirstOpen,
}: {
  preview: CategoryPreview;
  onClose: () => void;
  animateIn: boolean;
  isFirstOpen: boolean;
}) {
  const { category, products } = preview;
  const categoryHref = `/loja/categoria/${category.slug}`;

  return (
    <motion.div
      key="megamenu-shell"
      role="region"
      aria-label={`Produtos em ${category.name}`}
      initial={animateIn && isFirstOpen ? { opacity: 0, y: -6 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={animateIn ? { opacity: 0, y: -6 } : undefined}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute inset-x-0 top-full z-[90] border-b border-[var(--color-card-border)] bg-white shadow-lg shadow-[var(--color-brown)]/5"
    >
      <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={category.slug}
            initial={animateIn ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={animateIn ? { opacity: 0 } : undefined}
            transition={{ duration: 0.12, ease: "easeInOut" }}
          >
            <ProductTextLinks
              products={products}
              categoryHref={categoryHref}
              onNavigate={onClose}
            />
            <Link
              href={categoryHref}
              onClick={onClose}
              className="mt-3 inline-block text-sm font-semibold text-[var(--color-brown)] underline-offset-2 hover:underline"
            >
              Ver todos em {category.name}
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function MobileMegamenuPanel({
  preview,
  onClose,
  animateIn,
}: {
  preview: CategoryPreview;
  onClose: () => void;
  animateIn: boolean;
}) {
  const { category, products } = preview;
  const categoryHref = `/loja/categoria/${category.slug}`;

  return (
    <motion.div
      key={category.slug}
      role="region"
      aria-label={`Produtos em ${category.name}`}
      initial={animateIn ? { height: 0, opacity: 0 } : false}
      animate={{ height: "auto", opacity: 1 }}
      exit={animateIn ? { height: 0, opacity: 0 } : undefined}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden border-y border-[var(--color-card-border)] bg-white shadow-md"
    >
      <div className="px-4 py-4 sm:px-6">
        <ProductTextLinks
          products={products}
          categoryHref={categoryHref}
          onNavigate={onClose}
        />
        <Link
          href={categoryHref}
          onClick={onClose}
          className="mt-3 inline-block text-sm font-semibold text-[var(--color-brown)] underline-offset-2 hover:underline"
        >
          Ver todos em {category.name}
        </Link>
      </div>
    </motion.div>
  );
}

export function CategoryNavBar({
  previews,
  mobileNavOpen = false,
}: {
  previews: CategoryPreview[];
  mobileNavOpen?: boolean;
}) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [hoverCapable, setHoverCapable] = useState(
    () => typeof window !== "undefined" && window.matchMedia(HOVER_MQ).matches,
  );
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [mobileOpenSlug, setMobileOpenSlug] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverZoneRef = useRef<HTMLDivElement>(null);
  const panelWasOpenRef = useRef(false);

  const animateIn = !prefersReducedMotion;
  const isPanelFirstOpen = activeSlug != null && !panelWasOpenRef.current;

  const activePreview =
    activeSlug != null
      ? (previews.find((p) => p.category.slug === activeSlug) ?? null)
      : null;

  const mobilePreview =
    mobileOpenSlug != null
      ? (previews.find((p) => p.category.slug === mobileOpenSlug) ?? null)
      : null;

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      panelWasOpenRef.current = false;
      setActiveSlug(null);
    }, HOVER_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const openCategory = useCallback(
    (slug: string) => {
      if (!hoverCapable) return;
      clearCloseTimer();
      setMobileOpenSlug(null);
      setActiveSlug(slug);
    },
    [clearCloseTimer, hoverCapable],
  );

  const closeDesktop = useCallback(() => {
    clearCloseTimer();
    panelWasOpenRef.current = false;
    setActiveSlug(null);
  }, [clearCloseTimer]);

  useEffect(() => {
    if (activeSlug != null) {
      panelWasOpenRef.current = true;
    }
  }, [activeSlug]);

  useEffect(() => {
    const mq = window.matchMedia(HOVER_MQ);
    const sync = () => setHoverCapable(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    panelWasOpenRef.current = false;
    setActiveSlug(null);
    setMobileOpenSlug(null);
  }, [pathname]);

  useEffect(() => {
    if (mobileNavOpen) {
      setMobileOpenSlug(null);
      setActiveSlug(null);
    }
  }, [mobileNavOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDesktop();
        setMobileOpenSlug(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeDesktop]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  if (previews.length === 0) return null;

  return (
    <nav
      className="relative z-[55] border-b border-[var(--color-card-border)] bg-[var(--color-header-bg)]"
      aria-label="Categorias"
    >
      <div
        ref={hoverZoneRef}
        className="relative"
        onMouseLeave={hoverCapable ? scheduleClose : undefined}
      >
        <div className="fade-edges-x mx-auto min-w-0 max-w-7xl px-4 pr-6 sm:px-6 lg:px-8">
          <ul className="flex min-w-0 snap-x snap-mandatory items-stretch gap-0 overflow-x-auto overscroll-x-contain scroll-smooth whitespace-nowrap scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <li className="relative shrink-0 snap-start">
              <Link
                href="/loja"
                className={cn(
                  "relative inline-flex items-center whitespace-nowrap px-3 py-3 text-sm font-semibold text-[var(--color-brown)] transition hover:bg-[var(--secondary)] sm:px-4",
                  pathname === "/loja" && "bg-[var(--secondary)]",
                )}
              >
                Todos
                {pathname === "/loja" ? (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--color-cta)]" />
                ) : null}
              </Link>
            </li>
            {previews.map((preview) => {
              const { category } = preview;
              const href = `/loja/categoria/${category.slug}`;
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`);
              const desktopOpen = hoverCapable && activeSlug === category.slug;
              const mobileOpen = mobileOpenSlug === category.slug;

              return (
                <li key={category.id} className="relative shrink-0 snap-start">
                  <div
                    className="flex items-stretch"
                    onMouseEnter={
                      hoverCapable
                        ? () => openCategory(category.slug)
                        : undefined
                    }
                  >
                    <Link
                      href={href}
                      className={cn(
                        "relative inline-flex items-center whitespace-nowrap px-3 py-3 text-sm font-medium text-[var(--color-brown)] transition hover:bg-[var(--secondary)] sm:px-4",
                        (isActive || desktopOpen) &&
                          "bg-[var(--secondary)] font-semibold",
                      )}
                    >
                      {category.name}
                      {isActive || desktopOpen ? (
                        <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--color-cta)] transition-all duration-200" />
                      ) : null}
                    </Link>
                    <button
                      type="button"
                      className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center px-1 text-[var(--color-brown-muted)] transition hover:bg-[var(--secondary)] hover:text-[var(--color-brown)] sm:px-1.5 lg:px-2"
                      aria-expanded={desktopOpen || mobileOpen}
                      aria-label={`Ver produtos de ${category.name}`}
                      onFocus={
                        hoverCapable
                          ? () => openCategory(category.slug)
                          : undefined
                      }
                      onClick={() => {
                        setActiveSlug(null);
                        setMobileOpenSlug((s) =>
                          s === category.slug ? null : category.slug,
                        );
                      }}
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200",
                          (desktopOpen || mobileOpen) && "rotate-180",
                        )}
                      />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <AnimatePresence>
          {activePreview && hoverCapable && (
            <HoverMegamenuPanel
              preview={activePreview}
              onClose={closeDesktop}
              animateIn={animateIn}
              isFirstOpen={isPanelFirstOpen}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {!hoverCapable && mobilePreview && (
          <MobileMegamenuPanel
            preview={mobilePreview}
            onClose={() => setMobileOpenSlug(null)}
            animateIn={animateIn}
          />
        )}
      </AnimatePresence>
    </nav>
  );
}
