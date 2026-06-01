import { getMercadoPagoPublicKey } from "@/actions/checkout/mercadopago";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { PaymentPlaceholder } from "@/components/checkout/payment-placeholder";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo/metadata";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Checkout — Pagamento",
  path: "/checkout/pagamento",
  noIndex: true,
});

export default async function CheckoutPaymentPage() {
  const mercadoPagoPublicKey = await getMercadoPagoPublicKey();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <CheckoutSteps current={2} />
      <div className="rounded-3xl bg-white p-8 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold">Pagamento</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {mercadoPagoPublicKey
            ? "Mercado Pago configurado. Escolha a forma de pagamento."
            : "Configure o Mercado Pago em Admin → Configurações antes de pagar."}
        </p>
        <div className="mt-8">
          <PaymentPlaceholder publicKey={mercadoPagoPublicKey} />
        </div>
        <Button className="mt-8 w-full" asChild>
          <Link href="/checkout/confirmacao">Confirmar pedido</Link>
        </Button>
      </div>
    </div>
  );
}
