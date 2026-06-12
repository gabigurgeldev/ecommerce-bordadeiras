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

export function formatPaymentMethod(method: string | null | undefined): string {
  const map: Record<string, string> = {
    PIX: "Pix",
    CREDIT_CARD: "Cartão de crédito",
    BOLETO: "Boleto",
  };
  if (!method) return "—";
  return map[method] ?? method;
}

export function formatPaymentStatus(status: string | null | undefined): string {
  const map: Record<string, string> = {
    PENDING: "Pendente",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    REFUNDED: "Reembolsado",
    CANCELLED: "Cancelado",
  };
  if (!status) return "—";
  return map[status] ?? status;
}

export function getOrderNextStep(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Finalize o pagamento para confirmar seu pedido",
    PAID: "Aguarde — estamos preparando seu pedido",
    PROCESSING: "Seu pedido será enviado em breve",
    SHIPPED: "Rastreie sua entrega com o código abaixo",
    DELIVERED: "Pedido entregue com sucesso",
    CANCELLED: "Este pedido foi cancelado",
  };
  return map[status] ?? "Acompanhe as atualizações do pedido";
}

export function getOrderStatusDescription(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Aguardando confirmação do pagamento",
    PAID: "Pagamento confirmado — preparando seu pedido",
    PROCESSING: "Seu pedido está sendo separado",
    SHIPPED: "Pedido enviado — acompanhe a entrega",
    DELIVERED: "Pedido entregue",
    CANCELLED: "Pedido cancelado",
  };
  return map[status] ?? formatOrderStatus(status);
}
