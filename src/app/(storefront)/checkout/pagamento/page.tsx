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

export default function CheckoutPaymentPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <CheckoutSteps current={2} />
      <div className="rounded-3xl bg-white p-8 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold">Pagamento</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Integração Mercado Pago — UI placeholder para o agente de integrações.
        </p>
        <div className="mt-8">
          <PaymentPlaceholder />
        </div>
        <Button className="mt-8 w-full" asChild>
          <Link href="/checkout/confirmacao">Confirmar pedido</Link>
        </Button>
      </div>
    </div>
  );
}
