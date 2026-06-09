import { getAppOrigin } from "@/lib/app-url";

export type MelhorEnvioEnvironment = "sandbox" | "production";

const BASE_URLS: Record<MelhorEnvioEnvironment, string> = {
  sandbox: "https://sandbox.melhorenvio.com.br",
  production: "https://melhorenvio.com.br",
};

export const MELHOR_ENVIO_SCOPE = "shipping-calculate";

export const MELHOR_ENVIO_USER_AGENT =
  "Bordadeiras Ecommerce (suporte@bordadeiras.com.br)";

export function getMelhorEnvioBaseUrl(env: MelhorEnvioEnvironment): string {
  return BASE_URLS[env];
}

/** Full OAuth callback URL — must match Melhor Envio app registration exactly. */
export function getMelhorEnvioRedirectUri(): string {
  const override = process.env.MELHOR_ENVIO_REDIRECT_URI?.trim();
  if (override) {
    try {
      const url = new URL(override.includes("://") ? override : `https://${override}`);
      return url.href.replace(/\/$/, "");
    } catch {
      console.warn("[melhor-envio] MELHOR_ENVIO_REDIRECT_URI inválida; usando padrão");
    }
  }
  return `${getAppOrigin()}/api/integrations/melhor-envio/callback`;
}

export function getMelhorEnvioApiUrl(env: MelhorEnvioEnvironment, path: string): string {
  const base = getMelhorEnvioBaseUrl(env);
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
