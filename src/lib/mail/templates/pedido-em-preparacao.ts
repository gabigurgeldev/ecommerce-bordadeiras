import { emailLayout } from "./layout";

export function pedidoEmPreparacaoTemplate(params: {
  orderId: string;
  customerName: string;
}): string {
  const body = `
    <h1 style="margin:0 0 16px;font-size:20px;">Pedido em preparação</h1>
    <p>Olá, ${params.customerName}. Seu pedido <strong>#${params.orderId.slice(-8)}</strong> está sendo preparado para envio.</p>
    <p>Em breve você receberá o código de rastreio quando o pedido for despachado.</p>
  `;
  return emailLayout("Pedido em preparação", body);
}
