import {
  clearMelhorEnvioTokens,
  getActiveMelhorEnvioEnvironment,
  getMelhorEnvioCredentialsForEnv,
  getMelhorEnvioSettings,
  saveMelhorEnvioTokens,
} from "@/lib/data/melhor-envio-settings";
import {
  getMelhorEnvioApiUrl,
  getMelhorEnvioRedirectUri,
  MELHOR_ENVIO_SCOPE,
  MELHOR_ENVIO_USER_AGENT,
  type MelhorEnvioEnvironment,
} from "@/lib/melhor-envio/config";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

type TokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
};

function isHtmlResponse(raw: string): boolean {
  const trimmed = raw.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

export class MelhorEnvioTokenError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly description?: string;

  constructor(status: number, raw: string) {
    let code: string | undefined;
    let description: string | undefined;

    if (isHtmlResponse(raw)) {
      code = "html_response";
      if (status === 403) {
        description =
          "Acesso bloqueado (HTTP 403) ao trocar o token. Verifique se o servidor permite conexões HTTPS de saída para melhorenvio.com.br e se Client ID/Secret estão corretos.";
      } else if (status === 400) {
        description =
          "Resposta inválida do Melhor Envio. Confira Client ID, Secret e Redirect URI do ambiente ativo.";
      } else {
        description = `O Melhor Envio retornou erro HTTP ${status}. Tente novamente em instantes.`;
      }
    } else {
      try {
        const parsed = JSON.parse(raw) as {
          error?: string;
          error_description?: string;
          message?: string;
          hint?: string;
        };
        code = parsed.error;
        description =
          parsed.error_description ??
          parsed.message ??
          (parsed.hint ? `${parsed.message ?? parsed.error}: ${parsed.hint}` : undefined);
      } catch {
        description = raw.slice(0, 200) || undefined;
      }
    }

    super(description ?? `Melhor Envio token error ${status}`);
    this.name = "MelhorEnvioTokenError";
    this.status = status;
    this.code = code;
    this.description = description;
  }
}

export const ME_OAUTH_ENV_COOKIE = "me_oauth_env";
export const ME_OAUTH_REDIRECT_COOKIE = "me_oauth_redirect";

type OAuthStatePayload = {
  e: MelhorEnvioEnvironment;
  r: string;
};

export function buildMelhorEnvioOAuthState(
  env: MelhorEnvioEnvironment,
  redirectUri: string,
): string {
  const payload: OAuthStatePayload = { e: env, r: redirectUri };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function parseMelhorEnvioOAuthState(state: string | null): {
  env?: MelhorEnvioEnvironment;
  redirectUri?: string;
} {
  if (!state) return {};

  if (state === "production" || state === "sandbox") {
    return { env: state };
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as Partial<OAuthStatePayload>;
    const env =
      parsed.e === "production" || parsed.e === "sandbox" ? parsed.e : undefined;
    const redirectUri =
      typeof parsed.r === "string" && parsed.r.trim() ? parsed.r.trim() : undefined;
    return { env, redirectUri };
  } catch {
    return {};
  }
}

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

async function requestTokens(
  env: MelhorEnvioEnvironment,
  payload: Record<string, string>,
): Promise<TokenResponse> {
  const url = getMelhorEnvioApiUrl(env, "/oauth/token");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": MELHOR_ENVIO_USER_AGENT,
    },
    body: new URLSearchParams(payload).toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new MelhorEnvioTokenError(res.status, text);
  }

  return (await res.json()) as TokenResponse;
}

export function buildMelhorEnvioAuthorizationUrl(
  env: MelhorEnvioEnvironment,
  clientId: string,
  redirectUri: string = getMelhorEnvioRedirectUri(),
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: MELHOR_ENVIO_SCOPE,
    state: buildMelhorEnvioOAuthState(env, redirectUri),
  });
  return `${getMelhorEnvioApiUrl(env, "/oauth/authorize")}?${params.toString()}`;
}

export async function exchangeMelhorEnvioCode(
  env: MelhorEnvioEnvironment,
  code: string,
  redirectUri: string = getMelhorEnvioRedirectUri(),
): Promise<void> {
  const settings = await getMelhorEnvioSettings();
  const creds = getMelhorEnvioCredentialsForEnv(settings, env);

  const clientId = creds.clientId.trim();
  const clientSecret = creds.clientSecret.trim();

  if (!clientId || !clientSecret) {
    throw new MelhorEnvioTokenError(
      400,
      JSON.stringify({
        error: "missing_credentials",
        error_description: `Client ID ou Secret vazio para o ambiente ${env}. Salve as credenciais do ambiente ativo antes de conectar.`,
      }),
    );
  }

  const tokens = await requestTokens(env, {
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });
  const expiresAt = Date.now() + tokens.expires_in * 1000;

  await saveMelhorEnvioTokens(env, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
  });
}

async function refreshMelhorEnvioAccessToken(
  env: MelhorEnvioEnvironment,
): Promise<string> {
  const settings = await getMelhorEnvioSettings();
  const creds = getMelhorEnvioCredentialsForEnv(settings, env);

  if (!creds.refreshToken || !creds.clientId || !creds.clientSecret) {
    throw new Error("Melhor Envio não conectado ou credenciais incompletas");
  }

  const tokens = await requestTokens(env, {
    grant_type: "refresh_token",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: creds.refreshToken,
  });
  const expiresAt = Date.now() + tokens.expires_in * 1000;

  await saveMelhorEnvioTokens(env, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
  });

  return tokens.access_token;
}

export async function getValidMelhorEnvioAccessToken(): Promise<string | null> {
  const settings = await getMelhorEnvioSettings();
  const env = getActiveMelhorEnvioEnvironment(settings);
  const creds = getMelhorEnvioCredentialsForEnv(settings, env);

  if (!creds.accessToken) return null;

  const expiresAt = creds.expiresAt ?? 0;
  if (expiresAt - TOKEN_REFRESH_BUFFER_MS > Date.now()) {
    return creds.accessToken;
  }

  if (!creds.refreshToken) return null;

  try {
    return await refreshMelhorEnvioAccessToken(env);
  } catch (err) {
    console.error("[melhor-envio] token refresh failed:", err);
    return null;
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
