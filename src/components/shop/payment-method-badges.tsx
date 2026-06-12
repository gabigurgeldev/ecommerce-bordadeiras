"use client";

import { GlassCard } from "@/components/ui/glass-card";
import {
  checkoutPaymentMethods,
  paymentMethods,
  storefrontPaymentMethods,
  type PaymentMethod,
} from "@/lib/payment-methods";
import { cn } from "@/lib/utils";

type Variant = "compact" | "footer" | "checkout";

type PaymentMethodBadgesProps = {
  variant?: Variant;
  className?: string;
  methods?: PaymentMethod[];
};

function BadgeIcon({
  method,
  size,
  onDark = false,
}: {
  method: PaymentMethod;
  size: "sm" | "md" | "lg";
  onDark?: boolean;
}) {
  const { Icon, label, brandColor } = method;
  const dim =
    size === "lg" ? "h-9 w-9" : size === "md" ? "h-7 w-7" : "h-5 w-5";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-white/95 shadow-sm",
        onDark ? "ring-1 ring-white/20" : "ring-1 ring-black/5",
        size === "lg" ? "h-14 w-14" : size === "md" ? "h-11 w-11" : "h-9 w-9",
      )}
      aria-label={label}
      title={label}
    >
      <Icon
        className={dim}
        style={brandColor ? { color: brandColor } : undefined}
        aria-hidden
      />
    </span>
  );
}

export function PaymentMethodBadges({
  variant = "compact",
  className,
  methods,
}: PaymentMethodBadgesProps) {
  const list =
    methods ??
    (variant === "checkout"
      ? checkoutPaymentMethods
      : variant === "footer"
        ? paymentMethods
        : storefrontPaymentMethods);

  if (variant === "checkout") {
    return (
      <ul
        className={cn(
          "m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4",
          className,
        )}
        aria-label="Formas de pagamento aceitas"
      >
        {list.map((method) => (
          <li key={method.id} role="listitem">
            <GlassCard className="flex h-full cursor-pointer flex-col items-center border-2 border-transparent text-center transition hover:border-[var(--color-cta)]/40">
              <BadgeIcon method={method} size="lg" />
              <p className="mt-3 font-medium text-[var(--color-brown)]">
                {method.label}
              </p>
              {method.id === "pix" ? (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Aprovação instantânea
                </p>
              ) : method.id === "boleto" ? (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Vencimento em 3 dias
                </p>
              ) : method.id === "visa" || method.id === "mastercard" ? (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Até 12x sem juros
                </p>
              ) : null}
            </GlassCard>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "footer") {
    return (
      <div
        className={cn(
          "border-t border-white/10 bg-black/10 px-4 py-7 sm:px-6 lg:px-8",
          className,
        )}
      >
        <div className="mx-auto max-w-7xl">
          <p className="footer-label">Formas de pagamento</p>
          <p className="mt-3 text-xs text-[var(--footer-fg-muted)]/90 sm:text-sm">
            Pix, cartões e boleto — processado com segurança
          </p>
          <ul
            className="mt-4 flex flex-wrap justify-center gap-2.5 sm:justify-start sm:gap-3"
            role="list"
            aria-label="Bandeiras e métodos aceitos"
          >
            {list.map((method) => (
              <li key={method.id} role="listitem">
                <BadgeIcon method={method} size="md" onDark />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      aria-label="Formas de pagamento aceitas"
    >
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide opacity-90 sm:text-xs">
        Pix · cartões · boleto
      </span>
      <ul className="flex shrink-0 items-center gap-2" role="list">
        {list.map((method) => (
          <li key={method.id} role="listitem">
            <BadgeIcon method={method} size="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}
