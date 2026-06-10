import { PaymentMethod } from "@/lib/types/database";

export type AdminOrderListRow = {
  id: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  status: string;
  createdAt: string | Date;
  paidAt: string | Date | null;
  processingAt: string | Date | null;
  shippedAt: string | Date | null;
  deliveredAt: string | Date | null;
  cancelledAt: string | Date | null;
  trackingCode: string | null;
  carrier: string | null;
  itemCount: number;
  paymentMethod: string | null;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  [PaymentMethod.PIX]: "PIX",
  [PaymentMethod.CREDIT_CARD]: "Cartão",
  [PaymentMethod.BOLETO]: "Boleto",
};

export function formatAdminPaymentMethod(method: string | null): string {
  if (!method) return "—";
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export function mapAdminOrderListRow(row: Record<string, unknown>): AdminOrderListRow {
  const items = row.OrderItem;
  const itemCount = Array.isArray(items) ? items.length : 0;

  const payments = row.Payment;
  let paymentMethod: string | null = null;
  if (Array.isArray(payments) && payments.length > 0) {
    const approved = payments.find(
      (p) => String((p as Record<string, unknown>).status) === "APPROVED",
    ) as Record<string, unknown> | undefined;
    const p = approved ?? (payments[0] as Record<string, unknown>);
    paymentMethod = p?.method != null ? String(p.method) : null;
  }

  return {
    id: String(row.id),
    customerName: String(row.customerName ?? ""),
    customerEmail: String(row.customerEmail ?? ""),
    totalCents: Number(row.totalCents),
    status: String(row.status),
    createdAt: row.createdAt as string | Date,
    paidAt: (row.paidAt as string | Date | null) ?? null,
    processingAt: (row.processingAt as string | Date | null) ?? null,
    shippedAt: (row.shippedAt as string | Date | null) ?? null,
    deliveredAt: (row.deliveredAt as string | Date | null) ?? null,
    cancelledAt: (row.cancelledAt as string | Date | null) ?? null,
    trackingCode: row.trackingCode != null ? String(row.trackingCode) : null,
    carrier: row.carrier != null ? String(row.carrier) : null,
    itemCount,
    paymentMethod,
  };
}
