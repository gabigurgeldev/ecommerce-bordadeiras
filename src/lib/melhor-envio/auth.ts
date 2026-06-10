import {
  clearMelhorEnvioTokens,
  getActiveMelhorEnvioEnvironment,
  getMelhorEnvioTokenForEnv,
  getMelhorEnvioSettings,
  getPreferredMelhorEnvioEnvironment,
} from "@/lib/data/melhor-envio-settings";
import {
  getMelhorEnvioApiUrl,
  MELHOR_ENVIO_USER_AGENT,
  type MelhorEnvioEnvironment,
} from "@/lib/melhor-envio/config";
import { melhorEnvioHttpsGet } from "@/lib/melhor-envio/http";
import { decodeMelhorEnvioTokenExpiry } from "@/lib/melhor-envio/token-utils";

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

function melhorEnvioHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": MELHOR_ENVIO_USER_AGENT,
  };
}

function melhorEnvioAuthHeaders(accessToken: string): HeadersInit {
  return {
    ...melhorEnvioHeaders(),
    Authorization: `Bearer ${accessToken}`,
  };
}

export { decodeMelhorEnvioTokenExpiry } from "@/lib/melhor-envio/token-utils";

function isMelhorEnvioTokenExpired(
  accessToken: string,
  storedExpiresAt: number | null,
): boolean {
  const expiresAt = storedExpiresAt ?? decodeMelhorEnvioTokenExpiry(accessToken);
  if (!expiresAt) return false;
  return expiresAt - TOKEN_EXPIRY_BUFFER_MS <= Date.now();
}

export async function resolveValidMelhorEnvioCredentials(): Promise<{
  env: MelhorEnvioEnvironment;
  accessToken: string;
} | null> {
  const settings = await getMelhorEnvioSettings();
  const preferred = getPreferredMelhorEnvioEnvironment(settings);
  const alternate: MelhorEnvioEnvironment =
    preferred === "sandbox" ? "production" : "sandbox";

  const candidates = [
    getActiveMelhorEnvioEnvironment(settings),
    preferred,
    alternate,
  ];

  const seen = new Set<MelhorEnvioEnvironment>();
  for (const env of candidates) {
    if (seen.has(env)) continue;
    seen.add(env);

    const creds = getMelhorEnvioTokenForEnv(settings, env);
    if (!creds.accessToken) continue;
    if (isMelhorEnvioTokenExpired(creds.accessToken, creds.expiresAt)) continue;

    if (env !== preferred) {
      console.warn(
        `[melhor-envio] Usando token de ${env} (preferido: ${preferred}).`,
      );
    }

    return { env, accessToken: creds.accessToken };
  }

  return null;
}

export async function getValidMelhorEnvioAccessToken(): Promise<string | null> {
  const resolved = await resolveValidMelhorEnvioCredentials();
  return resolved?.accessToken ?? null;
}

/** Validate token against a real ME API endpoint (list transportadoras). */
export async function probeMelhorEnvioTokenAccess(
  env: MelhorEnvioEnvironment,
  accessToken: string,
): Promise<{ ok: boolean; status: number; message: string }> {
  const url = getMelhorEnvioApiUrl(env, "/api/v2/me/shipment/companies");

  try {
    const res = await melhorEnvioHttpsGet(url, {
      Accept: "application/json",
      "User-Agent": MELHOR_ENVIO_USER_AGENT,
      Authorization: `Bearer ${accessToken.trim()}`,
    });

    if (res.status >= 200 && res.status < 300) {
      return {
        ok: true,
        status: res.status,
        message: `Token válido no ambiente ${env} (HTTP ${res.status}).`,
      };
    }

    if (res.contentType.includes("application/json")) {
      let detail = res.body.slice(0, 120);
      try {
        const parsed = JSON.parse(res.body) as { message?: string };
        detail = parsed.message ?? detail;
      } catch {
        /* keep slice */
      }
      return {
        ok: false,
        status: res.status,
        message: `Token rejeitado (HTTP ${res.status}): ${detail}`,
      };
    }

    return {
      ok: false,
      status: res.status,
      message: `Resposta não-JSON (HTTP ${res.status}). Possível bloqueio de proxy/firewall no servidor.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro de rede";
    return { ok: false, status: 0, message: `Falha de conexão: ${msg}` };
  }
}

export async function disconnectMelhorEnvio(
  env?: MelhorEnvioEnvironment,
): Promise<void> {
  if (env) {
    await clearMelhorEnvioTokens(env);
    return;
  }
  await clearMelhorEnvioTokens("sandbox");
  await clearMelhorEnvioTokens("production");
}

export { melhorEnvioAuthHeaders, melhorEnvioHeaders };
