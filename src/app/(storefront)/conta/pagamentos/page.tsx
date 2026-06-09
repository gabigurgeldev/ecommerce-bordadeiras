import { PaymentMethodsManager } from "@/components/account/payment-methods-manager";
import {
  fetchSavedCards,
  syncCardsFromMp,
} from "@/actions/account/payment-methods";
import { getMercadoPagoPublicKey } from "@/actions/checkout/mercadopago";
import { buildMetadata } from "@/lib/seo/metadata";

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
    <div>
      <h2 className="font-display text-xl font-semibold text-[var(--color-brown)]">
        Formas de pagamento
      </h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Salve cartões com segurança via Mercado Pago para agilizar suas compras.
      </p>
      <div className="mt-6">
        <PaymentMethodsManager initialCards={cards} publicKey={publicKey} />
      </div>
    </div>
  );
}
