import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo/metadata";
import { XCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = buildMetadata({
  title: "Pagamento não concluído",
  path: "/checkout/failure",
  noIndex: true,
});

export default async function CheckoutFailurePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=%2Fcheckout");

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <XCircle className="mx-auto h-16 w-16 text-rose-500" />
      <h1 className="mt-6 text-2xl font-semibold">Pagamento não concluído</h1>
      <p className="mt-2 text-zinc-500">
        Não foi possível processar seu pagamento. Tente novamente ou escolha outra
        forma de pagamento.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/checkout">Tentar novamente</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/sacola">Voltar à sacola</Link>
        </Button>
      </div>
    </div>
  );
}
