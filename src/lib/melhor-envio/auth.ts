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

export class MelhorEnvioTokenError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly description?: string;

  constructor(status: number, raw: string) {
    let code: string | undefined;
    let description: string | undefined;
    try {
      const parsed = JSON.parse(raw) as {
        error?: string;
        error_description?: string;
        message?: string;
      };
      code = parsed.error;
      description = parsed.error_description ?? parsed.message;
    } catch {
      description = raw.slice(0, 200) || undefined;
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
  const headers = {
    Accept: "application/json",
    "User-Agent": MELHOR_ENVIO_USER_AGENT,
  };

  const attempts: Array<{ contentType: string; body: string }> = [
    {
      contentType: "application/x-www-form-urlencoded",
      body: new URLSearchParams(payload).toString(),
    },
    {
      contentType: "application/json",
      body: JSON.stringify(payload),
    },
  ];

  let lastError: MelhorEnvioTokenError | null = null;

  for (const attempt of attempts) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": attempt.contentType,
      },
      body: attempt.body,
      cache: "no-store",
    });

    if (res.ok) {
      return (await res.json()) as TokenResponse;
    }

    const text = await res.text().catch(() => "");
    lastError = new MelhorEnvioTokenError(res.status, text);
    if (res.status !== 415 && res.status !== 400) break;
  }

  throw lastError ?? new MelhorEnvioTokenError(500, "unknown token error");
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
    state: env,
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

  if (!creds.clientId || !creds.clientSecret) {
    throw new Error("Client ID e Client Secret não configurados para este ambiente");
  }

  const tokens = await requestTokens(env, {
    grant_type: "authorization_code",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
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
