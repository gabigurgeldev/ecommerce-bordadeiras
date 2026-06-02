import { Logo } from "@/components/brand/logo";
import { PaymentMethodBadges } from "@/components/shop/payment-method-badges";
import { siteConfig } from "@/lib/site";
import { Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/loja", label: "Loja" },
  { href: "/blog", label: "Blog" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

type FooterCategoryLink = { href: string; label: string };

export function Footer({ categories }: { categories: FooterCategoryLink[] }) {
  const categoryLinks: FooterCategoryLink[] = [
    { href: "/loja", label: "Todos os produtos" },
    ...categories,
  ];

  return (
    <footer className="bg-[var(--footer-bg)] text-[var(--footer-fg)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo variant="icon" href="/" className="rounded-lg bg-white/10 p-1" />
          <p className="mt-3 font-display text-lg font-semibold text-[var(--footer-fg)]">
            {siteConfig.name}{" "}
            <span className="font-normal text-[var(--footer-fg-muted)]">
              {siteConfig.tagline}
            </span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--footer-fg-muted)]">
            {siteConfig.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-price)]"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={siteConfig.social.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-price)]"
            >
              <Youtube className="h-5 w-5" />
            </a>
            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-green)]"
            >
              <FaWhatsapp className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <p className="font-display text-lg font-semibold text-[var(--footer-fg)]">
            Links rápidos
          </p>
          <ul className="mt-4 space-y-1">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="link-underline flex min-h-[44px] items-center text-sm text-[var(--footer-fg-muted)] transition hover:text-[var(--footer-fg)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display text-lg font-semibold text-[var(--footer-fg)]">
            Categorias
          </p>
          <ul className="mt-4 space-y-1">
            {categoryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="link-underline flex min-h-[44px] items-center text-sm text-[var(--footer-fg-muted)] transition hover:text-[var(--footer-fg)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-display text-lg font-semibold text-[var(--footer-fg)]">
            Contato
          </p>
          <ul className="mt-4 space-y-3 text-sm text-[var(--footer-fg-muted)]">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-price)]" />
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="break-all transition hover:text-[var(--footer-fg)]"
              >
                {siteConfig.contact.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-[var(--color-price)]" />
              <span>{siteConfig.contact.phone}</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-price)]" />
              <span className="break-words">{siteConfig.contact.address}</span>
            </li>
          </ul>
        </div>
      </div>

      <PaymentMethodBadges variant="footer" />

      <div className="border-t border-white/10 py-6 text-center text-xs text-[var(--footer-fg-muted)]/80">
        © {new Date().getFullYear()} {siteConfig.legalName}. Todos os direitos
        reservados.
      </div>
    </footer>
  );
}
