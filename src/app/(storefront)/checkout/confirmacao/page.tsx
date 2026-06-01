import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo/metadata";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Pedido confirmado",
  path: "/checkout/confirmacao",
  noIndex: true,
});

export default function CheckoutConfirmationPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
      <CheckoutSteps current={3} />
      <div className="rounded-3xl bg-white p-10 dark:bg-zinc-900">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-6 text-2xl font-semibold">Pedido recebido!</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Você receberá um e-mail com os detalhes. O pagamento será processado
          via Mercado Pago quando a integração estiver ativa.
        </p>
        <p className="mt-2 text-sm text-zinc-500">Nº do pedido: #DEMO-0001</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild>
            <Link href="/conta/pedidos">Ver meus pedidos</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/loja">Continuar comprando</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
