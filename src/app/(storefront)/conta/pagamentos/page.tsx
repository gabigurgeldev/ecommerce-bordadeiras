import { AccountSectionHeader } from "@/components/account/account-section-header";
import { PaymentMethodsManager } from "@/components/account/payment-methods-manager";
import {
  fetchSavedCards,
  syncCardsFromMp,
} from "@/actions/account/payment-methods";
import { getMercadoPagoPublicKey } from "@/actions/checkout/mercadopago";
import { buildMetadata } from "@/lib/seo/metadata";
import { Shield } from "lucide-react";

export const metadata = buildMetadata({
  title: "Formas de pagamento",
  path: "/conta/pagamentos",
  noIndex: true,
});

export default async function ContaPagamentosPage() {
  await syncCardsFromMp();
  const [cards, publicKey] = await Promise.all([
    fetchSavedCards(),
    getMercadoPagoPublicKey(),
  ]);

  return (
    <div className="space-y-6">
      <AccountSectionHeader
        title="Formas de pagamento"
        description="Salve cartões com segurança via Mercado Pago para agilizar suas compras."
      />
      <div className="flex items-start gap-3 rounded-xl border border-[var(--color-card-border)] bg-[var(--secondary)]/30 px-4 py-3 text-sm text-[var(--muted-foreground)]">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brown)]" />
        <p>
          Seus dados de cartão são tokenizados pelo Mercado Pago. Nós não
          armazenamos o número completo do cartão.
        </p>
      </div>
      <PaymentMethodsManager initialCards={cards} publicKey={publicKey} />
    </div>
  );
}
