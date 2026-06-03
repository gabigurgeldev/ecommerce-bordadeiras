"use client";

import { Logo } from "@/components/brand/logo";
import { CategoryNavBar, type CategoryPreview } from "@/components/layout/category-nav-bar";
import { CartBadge } from "@/components/providers/cart-badge";
import { useSession } from "@/components/providers/session-provider";
import { StoreSearchForm } from "@/components/shop/store-search-form";
import { Button } from "@/components/ui/button";
import type { StorefrontUtilitySettings } from "@/lib/data/storefront-settings";
import { siteConfig } from "@/lib/site";
import type { Category } from "@/lib/types/catalog";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Phone, Search, ShoppingBag, User, X, LogOut } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

function SignOutButton({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        void (async () => {
          const supabase = await getBrowserSupabase();
          if (supabase) await supabase.auth.signOut();
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/");
          router.refresh();
        })();
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[var(--color-brown)] transition hover:bg-[var(--color-brown)]/8",
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      <span>Sair</span>
    </button>
  );
}

function AccountLink({
  user,
  firstName,
  className,
  onNavigate,
}: {
  user: { name?: string | null } | undefined;
  firstName: string | undefined;
  className?: string;
  onNavigate?: () => void;
}) {
  const initial = firstName?.[0]?.toUpperCase() ?? "U";

  if (user) {
    return (
      <Link
        href="/conta"
        onClick={onNavigate}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[var(--color-brown)] transition hover:bg-[var(--color-brown)]/8",
          className,
        )}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-card-border)] bg-[var(--secondary)] text-xs font-semibold">
          {initial}
        </span>
        <span className="hidden lg:inline">Minha Conta</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      onClick={onNavigate}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--color-card-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-brown)] shadow-sm transition hover:bg-[var(--secondary)]",
        className,
      )}
    >
      <User className="h-4 w-4" />
      <span>Entrar</span>
    </Link>
  );
}

function UtilityMessage({
  settings,
}: {
  settings: StorefrontUtilitySettings;
}) {
  const content = settings.message.includes("<") ? (
    <span dangerouslySetInnerHTML={{ __html: settings.message }} />
  ) : (
    <span>{settings.message}</span>
  );

  if (settings.link) {
    return (
      <a
        href={settings.link}
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
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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

  const user = session?.user;
  const firstName = user?.name?.split(" ")[0];

  return (
    <header className="relative z-50">
      {/* Utility bar — scrolls away */}
      <div
        className="border-b border-black/10"
        style={{
          backgroundColor: utilitySettings.backgroundColor,
          color: utilitySettings.textColor,
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:text-sm lg:px-8">
          <p className="min-w-0 truncate sm:max-w-[55%]">
            <UtilityMessage settings={utilitySettings} />
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end sm:gap-4">
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
          "sticky top-0 z-50 bg-[var(--color-header-bg)] transition-shadow",
          scrolled && "shadow-md",
        )}
      >
        <div className="border-b border-[var(--color-card-border)] bg-[var(--color-header-bg)]">
          <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:gap-6">
              <Logo variant="compact" className="shrink-0 sm:hidden" />
              <Logo variant="full" className="hidden shrink-0 sm:flex" />

              <div className="hidden min-w-0 flex-1 lg:block">
                <StoreSearchForm categories={categories} />
              </div>

              <div className="ml-auto flex items-center gap-1 sm:gap-2">
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
                  className="hidden text-[var(--color-brown)] sm:inline-flex"
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
                  asChild
                >
                  <Link href="/sacola" aria-label="Sacola">
                    <ShoppingBag className="h-5 w-5" />
                    <CartBadge />
                  </Link>
                </Button>
                <AccountLink
                  user={user}
                  firstName={firstName}
                  className="hidden sm:inline-flex"
                />
                {user && (
                  <SignOutButton className="hidden sm:inline-flex" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[var(--color-brown)] lg:hidden"
                  onClick={() => setOpen((v) => !v)}
                  aria-label="Menu"
                  aria-expanded={open}
                >
                  {open ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            {mobileSearchOpen && (
              <div className="mt-3 lg:hidden">
                <StoreSearchForm categories={categories} />
              </div>
            )}
          </div>
        </div>

        <CategoryNavBar previews={categoryPreviews} />
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-[var(--color-brown)]/25 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              className="absolute inset-x-0 top-full z-50 max-h-[80vh] overflow-y-auto border-t border-[var(--color-card-border)] bg-white shadow-xl lg:hidden"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="px-4 py-4">
                <StoreSearchForm categories={categories} className="mb-4" />
                <div className="flex flex-col gap-0.5">
                  <Link
                    href="/loja"
                    onClick={() => setOpen(false)}
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
                      onClick={() => setOpen(false)}
                      className="flex min-h-[40px] items-center rounded-lg px-3 pl-5 text-sm text-[var(--color-brown)] hover:bg-[var(--secondary)]"
                    >
                      {cat.name}
                    </Link>
                  ))}
                  {siteConfig.nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-[44px] items-center rounded-lg px-3 font-medium text-[var(--color-brown)] hover:bg-[var(--secondary)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="my-2 h-px bg-[var(--color-card-border)]" />
                  <AccountLink
                    user={user}
                    firstName={firstName}
                    className="min-h-[44px] justify-start px-3"
                    onNavigate={() => setOpen(false)}
                  />
                  {user && (
                    <SignOutButton
                      className="min-h-[44px] justify-start px-3"
                      onNavigate={() => setOpen(false)}
                    />
                  )}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
