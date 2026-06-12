import type { OrderDetailItem } from "@/lib/data/orders";
import { formatCurrency } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

export function OrderItemsCard({ items }: { items: OrderDetailItem[] }) {
  return (
    <div className="account-card">
      <h3 className="font-display text-base font-semibold text-[var(--color-brown)]">
        Itens do pedido
      </h3>
      <ul className="mt-4 divide-y divide-[var(--color-card-border)]">
        {items.map((item) => {
          const lineTotal = item.priceCents * item.quantity;
          const content = (
            <>
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--secondary)] ring-1 ring-[var(--color-card-border)]">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <Package className="h-5 w-5 text-[var(--color-brown-muted)]" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--color-brown)]">
                  {item.name}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {item.quantity} × {formatCurrency(item.priceCents)}
                </p>
              </div>
              <p className="shrink-0 font-medium text-[var(--color-brown)]">
                {formatCurrency(lineTotal)}
              </p>
            </>
          );

          return (
            <li key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              {item.productSlug ? (
                <Link
                  href={`/produto/${item.productSlug}`}
                  className="flex w-full items-center gap-4 transition hover:opacity-90"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex w-full items-center gap-4">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
