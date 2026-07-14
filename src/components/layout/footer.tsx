import { Logo } from "@/components/brand/logo";
import { PaymentMethodBadges } from "@/components/shop/payment-method-badges";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/loja", label: "Loja" },
  { href: "/blog", label: "Blog" },
  { href: "/videos", label: "Vídeos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

const legalLinks = [
  { href: "/privacidade", label: "Privacidade" },
  { href: "/termos", label: "Termos de uso" },
];

const MAX_VISIBLE_CATEGORIES = 6;

const footerLinkClass =
  "link-underline flex min-h-[44px] items-center py-2 text-sm text-[var(--footer-fg-muted)] transition hover:text-[var(--footer-fg)] sm:min-h-0 sm:py-1.5";

type FooterCategoryLink = { href: string; label: string };

export function Footer({ categories }: { categories: FooterCategoryLink[] }) {
  const visibleCategories = categories.slice(0, MAX_VISIBLE_CATEGORIES);
  const hasMoreCategories = categories.length > MAX_VISIBLE_CATEGORIES;

  const categoryLinks: FooterCategoryLink[] = [
    { href: "/loja", label: "Todos os produtos" },
    ...visibleCategories,
  ];

  const phoneHref = `tel:${siteConfig.contact.phone.replace(/\D/g, "")}`;
  const whatsappHref = `https://wa.me/${siteConfig.contact.whatsapp}`;

  return (
    <footer className="border-t border-[#4a3628] bg-[var(--footer-bg)] text-[var(--footer-fg)] shadow-[0_-2px_16px_rgba(61,46,34,0.15)]">
      {/* CTA strip */}
      <div className="border-b border-[#4a3628] bg-[#4a3628]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-[var(--footer-fg)] sm:text-lg">
              Precisa de ajuda com seu pedido ou equipamento?
            </p>
            <p className="mt-1 text-sm text-[var(--footer-fg-muted)]/90">
              Nossa equipe responde pelo WhatsApp em horário comercial.
            </p>
            {siteConfig.promo.message ? (
              <Link
                href={siteConfig.promo.href}
                className="link-underline mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-price)] transition hover:text-[var(--footer-fg)]"
              >
                {siteConfig.promo.message}
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            ) : null}
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-green)] px-5 py-3 text-sm font-semibold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--footer-fg)]"
          >
            <FaWhatsapp className="h-5 w-5" aria-hidden />
            Falar no WhatsApp
          </a>
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:gap-10 sm:px-6 lg:grid-cols-4 lg:gap-8 lg:px-8 lg:py-14">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo
            variant="icon"
            href="/"
            className="rounded-lg bg-white/10 p-1 ring-1 ring-white/15"
          />
          <p className="mt-4 font-display text-lg font-semibold text-[var(--footer-fg)]">
            {siteConfig.name}
          </p>
          {siteConfig.tagline ? (
            <p className="mt-0.5 font-body text-[10px] font-medium uppercase tracking-wider text-[var(--footer-fg-muted)]/80">
              {siteConfig.tagline}
            </p>
          ) : null}
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--footer-fg-muted)]">
            {siteConfig.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-price)] hover:ring-[var(--color-price)]/40"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={siteConfig.social.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-price)] hover:ring-[var(--color-price)]/40"
            >
              <Youtube className="h-5 w-5" />
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-green)] hover:ring-[var(--color-green)]/40"
            >
              <FaWhatsapp className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <p className="footer-label">Links rápidos</p>
          <ul className="mt-4 space-y-0.5">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <p className="footer-label">Categorias</p>
          <ul className="mt-4 space-y-0.5">
            {categoryLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
            {hasMoreCategories ? (
              <li>
                <Link
                  href="/loja"
                  className={cn(footerLinkClass, "gap-1 font-medium text-[var(--color-price)] hover:text-[var(--footer-fg)]")}
                >
                  Ver todas na loja
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </li>
            ) : null}
          </ul>
        </div>

        {/* Contact */}
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="footer-label">Contato</p>
          <ul className="mt-4 space-y-3">
            <li className="flex items-start gap-3 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--footer-fg)]/10 ring-1 ring-[var(--footer-fg)]/15">
                <Mail className="h-4 w-4 text-[var(--color-price)]" aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--footer-fg-muted)]/70">
                  E-mail
                </p>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="mt-0.5 block break-all text-sm text-[var(--footer-fg-muted)] transition hover:text-[var(--footer-fg)]"
                >
                  {siteConfig.contact.email}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--footer-fg)]/10 ring-1 ring-[var(--footer-fg)]/15">
                <Phone className="h-4 w-4 text-[var(--color-price)]" aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--footer-fg-muted)]/70">
                  Telefone
                </p>
                <a
                  href={phoneHref}
                  className="mt-0.5 block text-sm text-[var(--footer-fg-muted)] transition hover:text-[var(--footer-fg)]"
                >
                  {siteConfig.contact.phone}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--footer-fg)]/10 ring-1 ring-[var(--footer-fg)]/15">
                <MapPin className="h-4 w-4 text-[var(--color-price)]" aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--footer-fg-muted)]/70">
                  Endereço
                </p>
                <span className="mt-0.5 block break-words text-sm text-[var(--footer-fg-muted)]">
                  {siteConfig.contact.address}
                </span>
              </div>
            </li>
          </ul>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--footer-fg)] transition hover:border-[var(--color-green)]/40 hover:bg-[var(--color-green)]/15 sm:w-auto"
          >
            <FaWhatsapp className="h-4 w-4 text-[var(--color-green)]" aria-hidden />
            Falar no WhatsApp
          </a>
        </div>
      </div>

      <PaymentMethodBadges variant="footer" />

      {/* Legal bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-5 text-xs text-[var(--footer-fg-muted)]/80 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} {siteConfig.legalName}. Todos os
            direitos reservados.
          </p>
          <nav
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1"
            aria-label="Links legais"
          >
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="link-underline text-[var(--footer-fg-muted)] transition hover:text-[var(--footer-fg)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
