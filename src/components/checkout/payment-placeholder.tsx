import { PaymentMethodBadges } from "@/components/shop/payment-method-badges";

/** Mercado Pago UI — publicKey from server (DB), never from NEXT_PUBLIC env */
export function PaymentPlaceholder({ publicKey }: { publicKey: string | null }) {
  return (
    <div className="space-y-4">
      {publicKey ? (
        <p
          className="text-xs text-[var(--muted-foreground)]"
          data-mp-configured="true"
        >
          Gateway ativo (chave pública carregada no servidor).
        </p>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          Configure o Mercado Pago em Admin → Configurações antes de pagar.
        </p>
      )}
      <PaymentMethodBadges variant="checkout" />
    </div>
  );
}
