import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PendingCheckoutResume } from "@/lib/data/pending-order";
import { CreditCard, Package } from "lucide-react";
import Link from "next/link";

export function PendingCheckoutBanner({
  order,
  compact = false,
  onContinue,
}: {
  order: PendingCheckoutResume;
  compact?: boolean;
  onContinue?: () => void;
}) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const checkoutHref = `/checkout?order=${order.orderId}`;

  return (
    <div
      className={`rounded-2xl border border-amber-200 bg-amber-50 text-left dark:border-amber-800 dark:bg-amber-950/30 ${
        compact ? "p-4" : "p-6"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
          <Package className="h-5 w-5 text-amber-700 dark:text-amber-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Pedido aguardando pagamento
          </p>
          <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/80">
            {formatDate(order.createdAt)} · {itemCount}{" "}
            {itemCount === 1 ? "item" : "itens"} ·{" "}
            {formatCurrency(order.totalCents)}
          </p>
          {!compact && (
            <p className="mt-2 text-sm text-amber-800/70 dark:text-amber-300/70">
              Você iniciou uma compra mas ainda não concluiu o pagamento. Continue de
              onde parou.
            </p>
          )}
        </div>
      </div>
      <div className={`flex flex-col gap-2 sm:flex-row ${compact ? "mt-4" : "mt-6"}`}>
        <Button className="gap-2" asChild>
          <Link href={checkoutHref} onClick={onContinue}>
            <CreditCard className="h-4 w-4" />
            Continuar pagamento
          </Link>
        </Button>
        {!compact && (
          <Button variant="outline" asChild>
            <Link href="/loja">Ir para a loja</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
