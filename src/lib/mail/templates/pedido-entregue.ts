import { emailLayout } from "./layout";

export function pedidoEntregueTemplate(params: {
  orderId: string;
  customerName: string;
}): string {
  const body = `
    <h1 style="margin:0 0 16px;font-size:20px;">Pedido entregue</h1>
    <p>Olá, ${params.customerName}. Seu pedido <strong>#${params.orderId.slice(-8)}</strong> foi entregue.</p>
    <p>Obrigado por comprar na Bordadeiras!</p>
  `;
  return emailLayout("Pedido entregue", body);
}
