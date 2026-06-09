import { ClearCartOnSuccess } from "@/components/checkout/clear-cart-on-success";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo/metadata";
import { getDb, TABLES } from "@/lib/supabase/db";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata = buildMetadata({
  title: "Pedido confirmado",
  path: "/checkout/success",
  noIndex: true,
});

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=%2Fcheckout");

  const { order: orderId } = await searchParams;
  if (!orderId) notFound();

  const db = getDb();
  const { data: order } = await db
    .from(TABLES.Order)
    .select("id, orderNumber, totalCents, status")
    .eq("id", orderId)
    .eq("userId", user.id)
    .maybeSingle();

  if (!order) notFound();

  const isPaid = String(order.status) === "PAID";

  if (!isPaid) {
    const { data: approvedPayment } = await db
      .from(TABLES.Payment)
      .select("id, status")
      .eq("orderId", orderId)
      .eq("status", "APPROVED")
      .limit(1)
      .maybeSingle();

    if (!approvedPayment) {
      const { data: pendingPayment } = await db
        .from(TABLES.Payment)
        .select("mercadoPagoId, status")
        .eq("orderId", orderId)
        .eq("status", "PENDING")
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingPayment?.mercadoPagoId) {
        redirect(
          `/checkout/pending?order=${orderId}&payment=${pendingPayment.mercadoPagoId}`,
        );
      }
      redirect(`/checkout/failure?order=${orderId}`);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <ClearCartOnSuccess />
      <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
      <h1 className="mt-6 text-2xl font-semibold">Pagamento confirmado!</h1>
      <p className="mt-2 text-zinc-500">
        Pedido <strong>#{String(order.orderNumber)}</strong> recebido com sucesso.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href={`/conta/pedidos/${order.id}`}>Ver pedido</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/loja">Continuar comprando</Link>
        </Button>
      </div>
    </div>
  );
}
