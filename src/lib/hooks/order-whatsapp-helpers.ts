import { siteConfig } from "@/lib/site";
import { normalizeBrazilPhone } from "@/lib/whatsapp-utils";

export function formatOrderDate(createdAt: string | Date): string {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  return date.toLocaleDateString("pt-BR");
}

export function buildOrderWhatsappMeta(order: {
  totalCents: unknown;
  createdAt: unknown;
  customerPhone?: unknown;
}) {
  return {
    amountCents: Number(order.totalCents),
    storeName: siteConfig.name,
    orderDate: formatOrderDate(String(order.createdAt)),
    customerPhone: order.customerPhone
      ? normalizeBrazilPhone(String(order.customerPhone))
      : null,
  };
}
