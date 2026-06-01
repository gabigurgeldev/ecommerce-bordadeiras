/** Base URL without trailing slash — avoids `//session/qr` when env ends with `/`. */
export function getWhatsappServiceBaseUrl(): string {
  const raw = process.env.WHATSAPP_SERVICE_URL ?? "http://localhost:4001";
  return raw.replace(/\/+$/, "");
}
