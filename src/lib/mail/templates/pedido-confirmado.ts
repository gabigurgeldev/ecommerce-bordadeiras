import { emailLayout } from "./layout";

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function pedidoConfirmadoTemplate(params: {
  orderId: string;
  customerName: string;
  totalCents: number;
  items: { name: string; quantity: number; priceCents: number }[];
}): string {
  const rows = params.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;">${i.name} × ${i.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;text-align:right;">${formatBRL(i.priceCents * i.quantity)}</td>
        </tr>`
    )
    .join("");

  const body = `
    <h1 style="margin:0 0 16px;font-size:20px;">Pedido confirmado</h1>
    <p>Olá, ${params.customerName}. Seu pedido <strong>#${params.orderId.slice(-8)}</strong> foi registrado.</p>
    <table role="presentation" width="100%" style="margin:16px 0;">${rows}</table>
    <p style="font-weight:bold;text-align:right;">Total: ${formatBRL(params.totalCents)}</p>
  `;
  return emailLayout("Pedido confirmado", body);
}
