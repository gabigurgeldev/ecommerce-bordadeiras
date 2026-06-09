import {
  clearMelhorEnvioTokens,
  getActiveMelhorEnvioEnvironment,
  getMelhorEnvioTokenForEnv,
  getMelhorEnvioSettings,
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

export async function getValidMelhorEnvioAccessToken(): Promise<string | null> {
  const settings = await getMelhorEnvioSettings();
  const env = getActiveMelhorEnvioEnvironment(settings);
  const creds = getMelhorEnvioTokenForEnv(settings, env);

  if (!creds.accessToken) return null;

  const expiresAt =
    creds.expiresAt ?? decodeMelhorEnvioTokenExpiry(creds.accessToken);
  if (expiresAt && expiresAt - TOKEN_EXPIRY_BUFFER_MS <= Date.now()) {
    return null;
  }

  return creds.accessToken;
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
