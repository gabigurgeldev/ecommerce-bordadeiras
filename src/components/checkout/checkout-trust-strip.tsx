"use client";

import Link from "next/link";
import { Lock, ShieldCheck, RotateCcw } from "lucide-react";
import type { CheckoutTheme } from "@/lib/checkout-theme";

interface TrustItem {
  icon: React.ElementType;
  label: string;
  href?: string;
}

export function CheckoutTrustStrip({
  theme,
}: {
  theme?: CheckoutTheme;
}) {
  const badges = theme?.icons?.trustBadges;
  const returnPolicyUrl = theme?.cta?.returnPolicyUrl;

  const items: TrustItem[] = [];

  if (!badges || badges.sslCertificate) {
    items.push({ icon: Lock, label: "Conexão SSL segura" });
  }
  if (!badges || badges.securePayment) {
    items.push({ icon: ShieldCheck, label: "Pagamento protegido" });
  }
  if (!badges || badges.moneyBackGuarantee) {
    items.push({
      icon: RotateCcw,
      label: "Política de devolução",
      href: returnPolicyUrl || undefined,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      {items.map((item) => {
        const Icon = item.icon;
        const content = (
          <span
            key={item.label}
            className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            {item.label}
          </span>
        );

        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-500 underline-offset-2 hover:text-rose-600 hover:underline dark:text-zinc-400"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              {item.label}
            </Link>
          );
        }

        return content;
      })}
    </div>
  );
}
