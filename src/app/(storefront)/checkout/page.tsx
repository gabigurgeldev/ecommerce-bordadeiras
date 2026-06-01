import Link from "next/link";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { CheckoutIdentifyForm } from "@/components/checkout/checkout-identify-form";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const metadata = buildMetadata({
  title: "Checkout — Identificação",
  path: "/checkout",
  noIndex: true,
});

export default async function CheckoutLoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/checkout/endereco");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <CheckoutSteps current={0} />
      <div className="rounded-3xl bg-white p-8 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold">Identificação</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Entre na sua conta ou continue como visitante.
        </p>
        <CheckoutIdentifyForm />
        <p className="mt-6 text-center text-sm text-zinc-500">
          Ainda não tem conta?{" "}
          <Link href="/cadastro?callbackUrl=%2Fcheckout%2Fendereco" className="underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
