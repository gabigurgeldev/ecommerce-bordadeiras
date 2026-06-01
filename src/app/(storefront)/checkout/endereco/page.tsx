import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildMetadata } from "@/lib/seo/metadata";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Checkout — Endereço",
  path: "/checkout/endereco",
  noIndex: true,
});

export default function CheckoutAddressPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <CheckoutSteps current={1} />
      <div className="rounded-3xl bg-white p-8 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold">Endereço de entrega</h1>
        <form className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-500">CEP</label>
            <Input name="cep" placeholder="00000-000" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-500">Rua</label>
            <Input name="street" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Número</label>
            <Input name="number" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Complemento</label>
            <Input name="complement" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Bairro</label>
            <Input name="neighborhood" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Cidade</label>
            <Input name="city" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">UF</label>
            <Input name="state" maxLength={2} placeholder="SP" />
          </div>
        </form>
        <p className="mt-4 text-xs text-zinc-500">
          Frete estimado: R$ 49,00 — 5–10 dias úteis (placeholder)
        </p>
        <Button className="mt-8 w-full" asChild>
          <Link href="/checkout/pagamento">Ir para pagamento</Link>
        </Button>
      </div>
    </div>
  );
}
