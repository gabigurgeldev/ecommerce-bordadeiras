"use client";

import { AccountMenu } from "@/components/account/account-menu";
import { StoreSearchForm } from "@/components/shop/store-search-form";
import { StorefrontSheet } from "@/components/storefront/storefront-sheet";
import { siteConfig } from "@/lib/site";
import type { Category } from "@/lib/types/catalog";
import Link from "next/link";

export function MobileNavSheet({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
}) {
  const close = () => onOpenChange(false);

  return (
    <StorefrontSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Menu"
      side="left"
      className="max-w-xs sm:max-w-sm"
    >
      <div className="px-4 py-4">
        <StoreSearchForm categories={categories} className="mb-4" />
        <nav className="flex flex-col gap-0.5" aria-label="Menu principal">
          <Link
            href="/loja"
            onClick={close}
            className="flex min-h-[44px] items-center rounded-lg px-3 font-medium text-[var(--color-brown)] hover:bg-[var(--secondary)]"
          >
            Loja
          </Link>
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-muted)]">
            Categorias
          </p>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/loja/categoria/${cat.slug}`}
              onClick={close}
              className="flex min-h-[40px] items-center rounded-lg px-3 pl-5 text-sm text-[var(--color-brown)] hover:bg-[var(--secondary)]"
            >
              {cat.name}
            </Link>
          ))}
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="flex min-h-[44px] items-center rounded-lg px-3 font-medium text-[var(--color-brown)] hover:bg-[var(--secondary)]"
            >
              {item.label}
            </Link>
          ))}
          <div className="my-2 h-px bg-[var(--color-card-border)]" />
          <AccountMenu className="px-3" onNavigate={close} />
        </nav>
      </div>
    </StorefrontSheet>
  );
}
