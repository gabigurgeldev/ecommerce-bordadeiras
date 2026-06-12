"use client";

import { MobileAccountSection } from "@/components/account/mobile-account-section";
import { StoreSearchForm } from "@/components/shop/store-search-form";
import { StorefrontSheet } from "@/components/storefront/storefront-sheet";
import { siteConfig } from "@/lib/site";
import type { Category } from "@/lib/types/catalog";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Info,
  LayoutGrid,
  MessageCircle,
  ShoppingBag,
  Store,
} from "lucide-react";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";

const navIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/": LayoutGrid,
  "/loja": Store,
  "/blog": BookOpen,
  "/sobre": Info,
  "/contato": MessageCircle,
};

function NavLink({
  href,
  label,
  icon: Icon,
  onClick,
  className,
  delay = 0,
  reduceMotion,
  external,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  className?: string;
  delay?: number;
  reduceMotion: boolean | null;
  external?: boolean;
}) {
  const linkClass = cn(
    "flex min-h-[44px] items-center gap-3 rounded-lg px-3 font-medium text-[var(--color-brown)] transition-colors duration-200 hover:bg-[var(--secondary)] active:bg-[var(--secondary)]",
    className,
  );

  const inner = (
    <>
      <Icon className="h-5 w-5 shrink-0 text-[var(--color-brown-muted)]" />
      {label}
    </>
  );

  const content = external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={linkClass}
    >
      {inner}
    </a>
  ) : (
    <Link href={href} onClick={onClick} className={linkClass}>
      {inner}
    </Link>
  );

  if (reduceMotion) return content;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {content}
    </motion.div>
  );
}

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
  const reduceMotion = useReducedMotion();

  const mainLinks = [
    { href: "/loja", label: "Loja", icon: Store },
    { href: "/blog", label: "Blog", icon: BookOpen },
    { href: "/sobre", label: "Sobre", icon: Info },
  ];

  return (
    <StorefrontSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Menu"
      side="left"
      headerClassName="gradient-mesh bg-[var(--secondary)]/30"
      className="w-[min(100vw,340px)] max-w-[min(100vw,340px)]"
    >
      <div className="flex flex-col px-4 py-4">
        <StoreSearchForm
          categories={categories}
          variant="panel"
          onNavigate={close}
          className="mb-4"
        />
        <nav className="flex flex-col gap-0.5" aria-label="Menu principal">
          {mainLinks.map((item, i) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              onClick={close}
              delay={i * 0.03}
              reduceMotion={reduceMotion}
            />
          ))}

          <NavLink
            href={`https://wa.me/${siteConfig.contact.whatsapp}`}
            label="WhatsApp"
            icon={FaWhatsapp}
            onClick={close}
            delay={0.09}
            reduceMotion={reduceMotion}
            external
          />

          <p className="label-caps mt-3 px-3 py-2">Categorias</p>
          {categories.map((cat, i) => (
            <NavLink
              key={cat.id}
              href={`/loja/categoria/${cat.slug}`}
              label={cat.name}
              icon={ShoppingBag}
              onClick={close}
              delay={(i + 4) * 0.03}
              reduceMotion={reduceMotion}
              className="pl-5 text-sm font-normal"
            />
          ))}

          {siteConfig.nav
            .filter((item) => !mainLinks.some((m) => m.href === item.href))
            .map((item, i) => {
              const Icon = navIcons[item.href] ?? LayoutGrid;
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={Icon}
                  onClick={close}
                  delay={(categories.length + i + 4) * 0.03}
                  reduceMotion={reduceMotion}
                />
              );
            })}
        </nav>

        <MobileAccountSection onNavigate={close} />
      </div>
    </StorefrontSheet>
  );
}
