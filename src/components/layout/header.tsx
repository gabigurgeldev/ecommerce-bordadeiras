"use client";

import { Logo } from "@/components/brand/logo";
import { CategoryNavBar, type CategoryPreview } from "@/components/layout/category-nav-bar";
import { AccountMenu } from "@/components/account/account-menu";
import { CartBadge } from "@/components/providers/cart-badge";
import { SearchCommandDialog } from "@/components/shop/search-command-dialog";
import { StoreSearchForm } from "@/components/shop/store-search-form";
import { Button } from "@/components/ui/button";
import type { StorefrontUtilitySettings } from "@/lib/data/storefront-settings";
import { sanitizeUrl, sanitizeUtilityHtml } from "@/lib/sanitize";
import { siteConfig } from "@/lib/site";
import type { Category } from "@/lib/types/catalog";
import { MobileNavSheet } from "@/components/layout/mobile-nav-sheet";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, Phone, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { CartPopup } from "@/components/cart/cart-popup";

function UtilityMessage({
  settings,
}: {
  settings: StorefrontUtilitySettings;
}) {
  const safeMessage = sanitizeUtilityHtml(settings.message);
  const safeLink = sanitizeUrl(settings.link);
  const content = (
    <span dangerouslySetInnerHTML={{ __html: safeMessage }} />
  );

  if (safeLink) {
    return (
      <a
        href={safeLink}
        className="font-medium underline-offset-2 hover:underline"
        style={{ color: "inherit" }}
      >
        {content}
      </a>
    );
  }

  return <span className="font-medium">{content}</span>;
}

export function Header({
  categories,
  utilitySettings,
  categoryPreviews,
}: {
  categories: Category[];
  utilitySettings: StorefrontUtilitySettings;
  categoryPreviews: CategoryPreview[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const overlayOpen = open || cartOpen || mobileSearchOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!overlayOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overlayOpen]);

  return (
    <header className="relative z-50 overflow-visible">
      {/* Utility bar — scrolls away */}
      <div
        className="border-b border-black/10"
        style={{
          backgroundColor: utilitySettings.backgroundColor,
          color: utilitySettings.textColor,
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 py-2 text-xs [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 sm:px-6 sm:text-sm lg:px-8 [&::-webkit-scrollbar]:hidden">
          <p className="min-w-0 truncate max-w-[60%] sm:max-w-[55%]">
            <UtilityMessage settings={utilitySettings} />
          </p>
          <div className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap sm:gap-4">
            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}`}
              className="font-medium opacity-90 hover:opacity-100 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
            <Link
              href="/sobre"
              className="opacity-90 hover:opacity-100 hover:underline"
            >
              Sobre
            </Link>
            <Link
              href="/videos"
              className="opacity-90 hover:opacity-100 hover:underline"
            >
              Vídeos
            </Link>
            <Link
              href="/blog"
              className="opacity-90 hover:opacity-100 hover:underline"
            >
              Blog
            </Link>
            <span className="hidden items-center gap-1 sm:inline-flex">
              <Phone className="h-3.5 w-3.5" />
              {siteConfig.contact.phone}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky: main + category nav */}
      <div
        className={cn(
          "sticky top-0 z-50 overflow-visible bg-[var(--color-header-bg)] pt-[env(safe-area-inset-top)] transition-shadow duration-300",
          scrolled ? "shadow-md shadow-[var(--color-brown)]/8" : "shadow-none",
        )}
      >
        <div className="overflow-visible border-b border-[var(--color-card-border)] bg-[var(--color-header-bg)]">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-6">
              <Logo variant="compact" className="min-w-0 sm:hidden" />
              <Logo variant="full" className="hidden shrink-0 sm:flex" />

              <div className="hidden min-w-0 flex-1 lg:block">
                <StoreSearchForm categories={categories} />
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[var(--color-brown)] lg:hidden"
                  onClick={() => setMobileSearchOpen((v) => !v)}
                  aria-label="Buscar"
                  aria-expanded={mobileSearchOpen}
                >
                  <Search className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden text-[var(--color-brown)] sm:inline-flex lg:hidden"
                  asChild
                >
                  <a
                    href={`https://wa.me/${siteConfig.contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                  >
                    <FaWhatsapp className="h-5 w-5" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-[var(--color-brown)]"
                  onClick={() => setCartOpen(true)}
                  aria-label="Sacola"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <CartBadge />
                </Button>
                <AccountMenu className="hidden sm:inline-flex" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[var(--color-brown)] lg:hidden"
                  onClick={() => setOpen(true)}
                  aria-label="Menu"
                  aria-expanded={open}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <CategoryNavBar previews={categoryPreviews} mobileNavOpen={open} />
      </div>

      <AnimatePresence initial={false}>
        {mobileSearchOpen ? (
          <>
            <motion.button
              key="search-backdrop"
              type="button"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-[100] bg-black/60 lg:hidden motion-reduce:transition-none"
              aria-label="Fechar busca"
              onClick={() => setMobileSearchOpen(false)}
            />
            <motion.div
              key="search-panel"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-0 z-[101] border-b border-[var(--color-card-border)] bg-[var(--color-header-bg)] px-4 pb-4 pt-[env(safe-area-inset-top)] shadow-md lg:hidden"
            >
              <div className="mx-auto max-w-7xl pt-3">
                <StoreSearchForm
                  categories={categories}
                  variant="panel"
                  onNavigate={() => setMobileSearchOpen(false)}
                />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <MobileNavSheet
        open={open}
        onOpenChange={setOpen}
        categories={categories}
      />

      <CartPopup open={cartOpen} onClose={() => setCartOpen(false)} />
      <SearchCommandDialog categories={categories} />
    </header>
  );
}
