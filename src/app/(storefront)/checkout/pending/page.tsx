import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo/metadata";
import { getDb, TABLES } from "@/lib/supabase/db";
import { Clock } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata = buildMetadata({
  title: "Pagamento pendente",
  path: "/checkout/pending",
  noIndex: true,
});

export default async function CheckoutPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; payment?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=%2Fcheckout");

  const { order: orderId } = await searchParams;
  if (!orderId) notFound();

  const db = getDb();
  const { data: order } = await db
    .from(TABLES.Order)
    .select("id, orderNumber")
    .eq("id", orderId)
    .eq("userId", user.id)
    .maybeSingle();

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <Clock className="mx-auto h-16 w-16 text-amber-500" />
      <h1 className="mt-6 text-2xl font-semibold">Pagamento pendente</h1>
      <p className="mt-2 text-zinc-500">
        Pedido <strong>#{String(order.orderNumber)}</strong> aguardando confirmação
        (PIX ou boleto). Você receberá um e-mail quando o pagamento for aprovado.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href={`/conta/pedidos/${order.id}`}>Acompanhar pedido</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/loja">Voltar à loja</Link>
        </Button>
      </div>
    </div>
  );
}
