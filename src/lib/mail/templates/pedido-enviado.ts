import { emailLayout } from "./layout";

export function pedidoEnviadoTemplate(params: {
  orderId: string;
  customerName: string;
  trackingCode?: string | null;
  trackingUrl?: string | null;
}): string {
  const tracking = params.trackingCode
    ? params.trackingUrl
      ? `<p>Código de rastreio: <strong>${params.trackingCode}</strong><br><a href="${params.trackingUrl}">Rastrear pedido</a></p>`
      : `<p>Código de rastreio: <strong>${params.trackingCode}</strong></p>`
    : "";
  const body = `
    <h1 style="margin:0 0 16px;font-size:20px;">Pedido enviado</h1>
    <p>Olá, ${params.customerName}. Seu pedido <strong>#${params.orderId.slice(-8)}</strong> foi despachado.</p>
    ${tracking}
  `;
  return emailLayout("Pedido enviado", body);
}
