import { getWhatsappServiceBaseUrl } from "@/lib/whatsapp-service-url";

const FETCH_TIMEOUT_MS = 15_000;

export class WhatsappServiceError extends Error {
  constructor(
    message: string,
    readonly code: "unreachable" | "timeout" | "http" | "unknown",
    readonly status?: number,
  ) {
    super(message);
    this.name = "WhatsappServiceError";
  }
}

function describeFetchError(err: unknown, baseUrl: string): WhatsappServiceError {
  if (err instanceof WhatsappServiceError) return err;

  const cause = err instanceof Error ? err : new Error(String(err));
  const msg = cause.message.toLowerCase();

  if (cause.name === "AbortError" || msg.includes("timeout")) {
    return new WhatsappServiceError(
      `Timeout ao conectar no serviço WhatsApp (${baseUrl})`,
      "timeout",
    );
  }

  if (
    msg.includes("fetch failed") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("network") ||
    msg.includes("getaddrinfo")
  ) {
    return new WhatsappServiceError(
      `Serviço WhatsApp inacessível em ${baseUrl}. Verifique se o container whatsapp-service está rodando e se WHATSAPP_SERVICE_URL está correto na app.`,
      "unreachable",
    );
  }

  return new WhatsappServiceError(cause.message || "Erro desconhecido no serviço WhatsApp", "unknown");
}

export async function fetchWhatsappService(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const baseUrl = getWhatsappServiceBaseUrl();
  const secret = process.env.WHATSAPP_SERVICE_SECRET ?? "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    throw describeFetchError(err, baseUrl);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchWhatsappServiceJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetchWhatsappService(path, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new WhatsappServiceError(
      text || `WhatsApp service error ${res.status}`,
      "http",
      res.status,
    );
  }
  return res.json() as Promise<T>;
}
