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
  body: URLSearchParams,
): Promise<TokenResponse> {
  const creds = getMelhorEnvioCredentialsForEnv(await getMelhorEnvioSettings(), env);
  const url = getMelhorEnvioApiUrl(env, "/oauth/token");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": MELHOR_ENVIO_USER_AGENT,
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Melhor Envio token error ${res.status}: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as TokenResponse;
}

export function buildMelhorEnvioAuthorizationUrl(
  env: MelhorEnvioEnvironment,
  clientId: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getMelhorEnvioRedirectUri(),
    response_type: "code",
    scope: MELHOR_ENVIO_SCOPE,
    state: env,
  });
  return `${getMelhorEnvioApiUrl(env, "/oauth/authorize")}?${params.toString()}`;
}

export async function exchangeMelhorEnvioCode(
  env: MelhorEnvioEnvironment,
  code: string,
): Promise<void> {
  const settings = await getMelhorEnvioSettings();
  const creds = getMelhorEnvioCredentialsForEnv(settings, env);

  if (!creds.clientId || !creds.clientSecret) {
    throw new Error("Client ID e Client Secret não configurados para este ambiente");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    redirect_uri: getMelhorEnvioRedirectUri(),
    code,
  });

  const tokens = await requestTokens(env, body);
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

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: creds.refreshToken,
  });

  const tokens = await requestTokens(env, body);
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
