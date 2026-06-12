"use client";

import { buildShareUrls } from "@/lib/blog/public-utils";
import { Check, Copy, Facebook, Linkedin, Share2, Twitter } from "lucide-react";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

export function BlogShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const share = buildShareUrls(url, title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const buttons = [
    {
      href: share.whatsapp,
      label: "WhatsApp",
      icon: FaWhatsapp,
      className: "hover:border-[#25D366]/40 hover:bg-[#25D366]/10 hover:text-[#25D366]",
    },
    {
      href: share.facebook,
      label: "Facebook",
      icon: Facebook,
      className: "hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 hover:text-[#1877F2]",
    },
    {
      href: share.twitter,
      label: "X (Twitter)",
      icon: Twitter,
      className: "hover:border-black/20 hover:bg-black/5 hover:text-black",
    },
    {
      href: share.linkedin,
      label: "LinkedIn",
      icon: Linkedin,
      className: "hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]",
    },
  ] as const;

  return (
    <div>
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-[var(--color-green)]" aria-hidden />
        <span className="font-display text-base font-semibold text-[var(--color-brown)]">
          Compartilhar este artigo
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {buttons.map(({ href, label, icon: Icon, className }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Compartilhar no ${label}`}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-card-border)] bg-white text-[var(--color-brown)] transition ${className}`}
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copiar link"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-card-border)] bg-white px-4 text-sm font-medium text-[var(--color-brown)] transition hover:bg-[var(--secondary)]"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-[var(--color-green)]" />
              Link copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copiar link
            </>
          )}
        </button>
      </div>
    </div>
  );
}
