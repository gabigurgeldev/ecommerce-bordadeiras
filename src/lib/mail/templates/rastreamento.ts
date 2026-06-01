import { button, emailLayout } from "./layout";

export function rastreamentoTemplate(params: {
  customerName: string;
  orderId: string;
  trackingCode: string;
  trackingUrl?: string;
}): string {
  const link = params.trackingUrl
    ? button(params.trackingUrl, "Rastrear encomenda")
    : `<p>Código: <strong>${params.trackingCode}</strong></p>`;

  const body = `
    <h1 style="margin:0 0 16px;font-size:20px;">Atualização de rastreamento</h1>
    <p>Olá, ${params.customerName}. Há uma atualização no pedido <strong>#${params.orderId.slice(-8)}</strong>.</p>
    ${link}
  `;
  return emailLayout("Rastreamento", body);
}
