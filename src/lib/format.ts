export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatInstallment(
  cents: number,
  installments: number = 12,
): string {
  const per = Math.ceil(cents / installments);
  return `${installments}x de ${formatCurrency(per)} sem juros`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatOrderStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Aguardando pagamento",
    PAID: "Pago",
    PROCESSING: "Em preparação",
    SHIPPED: "Enviado",
    DELIVERED: "Entregue",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}
