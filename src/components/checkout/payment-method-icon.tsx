import type { ComponentType } from "react";
import type { CheckoutPaymentMethodId } from "@/lib/checkout-payment-methods";
import { cn } from "@/lib/utils";

const ICON_CLASS = "h-10 w-10";

function PixIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn(ICON_CLASS, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="#32BCAD"
        d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156"
      />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn(ICON_CLASS, className)}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="1" y="4" width="46" height="24" rx="4" fill="#1E3A5F" stroke="#0F172A" strokeWidth="1" />
      <rect x="1" y="10" width="46" height="6" fill="#0EA5E9" />
      <rect x="6" y="21" width="14" height="3" rx="1" fill="#F8FAFC" opacity="0.9" />
      <rect x="24" y="21" width="10" height="3" rx="1" fill="#F8FAFC" opacity="0.6" />
    </svg>
  );
}

function DebitCardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn(ICON_CLASS, className)}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="1" y="4" width="46" height="24" rx="4" fill="#14532D" stroke="#052E16" strokeWidth="1" />
      <rect x="1" y="10" width="46" height="6" fill="#22C55E" />
      <rect x="6" y="21" width="14" height="3" rx="1" fill="#F8FAFC" opacity="0.9" />
      <rect x="24" y="21" width="10" height="3" rx="1" fill="#F8FAFC" opacity="0.6" />
      <text x="36" y="24" fill="#DCFCE7" fontSize="5" fontWeight="700" fontFamily="system-ui,sans-serif">
        DÉB
      </text>
    </svg>
  );
}

function BoletoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn(ICON_CLASS, className)}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="4" y="2" width="40" height="28" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
      {[8, 12, 16, 20, 24, 28, 32, 36].map((x) => (
        <rect key={x} x={x} y="6" width="2" height="20" fill="#92400E" />
      ))}
    </svg>
  );
}

const ICONS: Record<
  CheckoutPaymentMethodId,
  ComponentType<{ className?: string }>
> = {
  pix: PixIcon,
  credit_card: CreditCardIcon,
  debit_card: DebitCardIcon,
  boleto: BoletoIcon,
};

export function PaymentMethodIcon({
  method,
  className,
}: {
  method: CheckoutPaymentMethodId;
  className?: string;
}) {
  const Icon = ICONS[method];
  return <Icon className={className} />;
}
