"use client";

import Link from "next/link";
import type { CheckoutTheme } from "@/lib/checkout-theme";

export function CheckoutFooterLinks({ theme }: { theme?: CheckoutTheme }) {
  const footer = theme?.footer;

  if (!footer?.showFooterLinks) return null;

  const links: { label: string; href: string }[] = [];

  if (footer.privacyUrl) {
    links.push({ label: "Política de privacidade", href: footer.privacyUrl });
  }
  if (footer.termsUrl) {
    links.push({ label: "Termos de uso", href: footer.termsUrl });
  }

  if (links.length === 0) return null;

  return (
    <footer className="mt-10 border-t border-zinc-100 pt-6 pb-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-600 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            {link.label}
          </Link>
        ))}
        <span className="text-xs text-zinc-300 dark:text-zinc-600">
          © {new Date().getFullYear()} Bordadeiras
        </span>
      </div>
    </footer>
  );
}
