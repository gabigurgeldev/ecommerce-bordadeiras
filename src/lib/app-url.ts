const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** Normalized app origin from NEXT_PUBLIC_APP_URL (no trailing slash). */
export function getAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return "http://localhost:3000";
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
}

/**
 * Mercado Pago only accepts public HTTPS notification URLs.
 * Returns undefined for localhost, HTTP, or malformed URLs.
 */
export function resolveMercadoPagoNotificationUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return undefined;

  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (url.protocol !== "https:") return undefined;
    if (LOCAL_HOSTS.has(url.hostname)) return undefined;
    return `${url.origin}/api/webhooks/mercadopago`;
  } catch {
    return undefined;
  }
}
