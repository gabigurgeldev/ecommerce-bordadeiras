import { getSetting, getSettings, setSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/settings-keys";
import type { MelhorEnvioEnvironment } from "@/lib/melhor-envio/config";

export type MelhorEnvioEnvCredentials = {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
};

export type MelhorEnvioSettings = {
  useSandbox: boolean;
  sandbox: MelhorEnvioEnvCredentials;
  production: MelhorEnvioEnvCredentials;
};

const EMPTY_CREDS: MelhorEnvioEnvCredentials = {
  clientId: "",
  clientSecret: "",
  accessToken: "",
  refreshToken: "",
  expiresAt: null,
};

const ALL_KEYS = Object.values(SETTING_KEYS.melhorEnvio);

function parseExpiresAt(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function getMelhorEnvioSettings(): Promise<MelhorEnvioSettings> {
  const values = await getSettings([...ALL_KEYS]);

  const readEnv = (prefix: "sandbox" | "production"): MelhorEnvioEnvCredentials => {
    const isSandbox = prefix === "sandbox";
    return {
      clientId:
        values[
          isSandbox
            ? SETTING_KEYS.melhorEnvio.sandboxClientId
            : SETTING_KEYS.melhorEnvio.productionClientId
        ]?.trim() ?? "",
      clientSecret:
        values[
          isSandbox
            ? SETTING_KEYS.melhorEnvio.sandboxClientSecret
            : SETTING_KEYS.melhorEnvio.productionClientSecret
        ]?.trim() ?? "",
      accessToken:
        values[
          isSandbox
            ? SETTING_KEYS.melhorEnvio.sandboxAccessToken
            : SETTING_KEYS.melhorEnvio.productionAccessToken
        ]?.trim() ?? "",
      refreshToken:
        values[
          isSandbox
            ? SETTING_KEYS.melhorEnvio.sandboxRefreshToken
            : SETTING_KEYS.melhorEnvio.productionRefreshToken
        ]?.trim() ?? "",
      expiresAt: parseExpiresAt(
        values[
          isSandbox
            ? SETTING_KEYS.melhorEnvio.sandboxExpiresAt
            : SETTING_KEYS.melhorEnvio.productionExpiresAt
        ],
      ),
    };
  };

  return {
    useSandbox: values[SETTING_KEYS.melhorEnvio.useSandbox] !== "false",
    sandbox: readEnv("sandbox"),
    production: readEnv("production"),
  };
}

export function getActiveMelhorEnvioEnvironment(
  settings: MelhorEnvioSettings,
): MelhorEnvioEnvironment {
  return settings.useSandbox ? "sandbox" : "production";
}

export function getMelhorEnvioCredentialsForEnv(
  settings: MelhorEnvioSettings,
  env: MelhorEnvioEnvironment,
): MelhorEnvioEnvCredentials {
  return env === "sandbox" ? settings.sandbox : settings.production;
}

export function isMelhorEnvioConnected(settings: MelhorEnvioSettings): boolean {
  const env = getActiveMelhorEnvioEnvironment(settings);
  const creds = getMelhorEnvioCredentialsForEnv(settings, env);
  return Boolean(creds.accessToken && creds.refreshToken);
}

export async function saveMelhorEnvioCredentials(data: {
  useSandbox: boolean;
  sandboxClientId: string;
  sandboxClientSecret: string;
  productionClientId: string;
  productionClientSecret: string;
}): Promise<void> {
  const current = await getMelhorEnvioSettings();

  await setSettings({
    [SETTING_KEYS.melhorEnvio.useSandbox]: data.useSandbox ? "true" : "false",
    [SETTING_KEYS.melhorEnvio.sandboxClientId]: data.sandboxClientId.trim(),
    [SETTING_KEYS.melhorEnvio.sandboxClientSecret]: data.sandboxClientSecret.trim(),
    [SETTING_KEYS.melhorEnvio.productionClientId]: data.productionClientId.trim(),
    [SETTING_KEYS.melhorEnvio.productionClientSecret]:
      data.productionClientSecret.trim(),
    // Preserve tokens when only updating credentials
    [SETTING_KEYS.melhorEnvio.sandboxAccessToken]: current.sandbox.accessToken,
    [SETTING_KEYS.melhorEnvio.sandboxRefreshToken]: current.sandbox.refreshToken,
    [SETTING_KEYS.melhorEnvio.sandboxExpiresAt]:
      current.sandbox.expiresAt != null ? String(current.sandbox.expiresAt) : "",
    [SETTING_KEYS.melhorEnvio.productionAccessToken]: current.production.accessToken,
    [SETTING_KEYS.melhorEnvio.productionRefreshToken]: current.production.refreshToken,
    [SETTING_KEYS.melhorEnvio.productionExpiresAt]:
      current.production.expiresAt != null
        ? String(current.production.expiresAt)
        : "",
  });
}

export async function saveMelhorEnvioTokens(
  env: MelhorEnvioEnvironment,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  },
): Promise<void> {
  const current = await getMelhorEnvioSettings();
  const isSandbox = env === "sandbox";

  await setSettings({
    [SETTING_KEYS.melhorEnvio.sandboxAccessToken]: isSandbox
      ? tokens.accessToken
      : current.sandbox.accessToken,
    [SETTING_KEYS.melhorEnvio.sandboxRefreshToken]: isSandbox
      ? tokens.refreshToken
      : current.sandbox.refreshToken,
    [SETTING_KEYS.melhorEnvio.sandboxExpiresAt]: isSandbox
      ? String(tokens.expiresAt)
      : String(current.sandbox.expiresAt ?? ""),
    [SETTING_KEYS.melhorEnvio.productionAccessToken]: isSandbox
      ? current.production.accessToken
      : tokens.accessToken,
    [SETTING_KEYS.melhorEnvio.productionRefreshToken]: isSandbox
      ? current.production.refreshToken
      : tokens.refreshToken,
    [SETTING_KEYS.melhorEnvio.productionExpiresAt]: isSandbox
      ? String(current.production.expiresAt ?? "")
      : String(tokens.expiresAt),
  });
}

export type MelhorEnvioOAuthPending = {
  state: string;
  env: MelhorEnvioEnvironment;
  redirectUri: string;
  expiresAt: number;
};

const OAUTH_PENDING_TTL_MS = 10 * 60 * 1000;

export async function saveMelhorEnvioOAuthPending(data: {
  state: string;
  env: MelhorEnvioEnvironment;
  redirectUri: string;
}): Promise<void> {
  const pending: MelhorEnvioOAuthPending = {
    state: data.state,
    env: data.env,
    redirectUri: data.redirectUri,
    expiresAt: Date.now() + OAUTH_PENDING_TTL_MS,
  };
  await setSettings({
    [SETTING_KEYS.melhorEnvio.oauthPending]: JSON.stringify(pending),
  });
}

export async function consumeMelhorEnvioOAuthPending(
  state: string | null,
): Promise<{ env: MelhorEnvioEnvironment; redirectUri: string } | null> {
  if (!state?.trim()) return null;

  const raw = await getSetting(SETTING_KEYS.melhorEnvio.oauthPending);
  await setSettings({ [SETTING_KEYS.melhorEnvio.oauthPending]: "" });
  if (!raw?.trim()) return null;

  try {
    const pending = JSON.parse(raw) as MelhorEnvioOAuthPending;
    if (pending.state !== state) return null;
    if (!pending.expiresAt || pending.expiresAt < Date.now()) return null;
    if (pending.env !== "sandbox" && pending.env !== "production") return null;
    if (!pending.redirectUri?.trim()) return null;
    return { env: pending.env, redirectUri: pending.redirectUri.trim() };
  } catch {
    return null;
  }
}

export async function clearMelhorEnvioTokens(
  env: MelhorEnvioEnvironment,
): Promise<void> {
  const current = await getMelhorEnvioSettings();
  const isSandbox = env === "sandbox";

  await setSettings({
    [SETTING_KEYS.melhorEnvio.sandboxAccessToken]: isSandbox
      ? ""
      : current.sandbox.accessToken,
    [SETTING_KEYS.melhorEnvio.sandboxRefreshToken]: isSandbox
      ? ""
      : current.sandbox.refreshToken,
    [SETTING_KEYS.melhorEnvio.sandboxExpiresAt]: isSandbox
      ? ""
      : String(current.sandbox.expiresAt ?? ""),
    [SETTING_KEYS.melhorEnvio.productionAccessToken]: isSandbox
      ? current.production.accessToken
      : "",
    [SETTING_KEYS.melhorEnvio.productionRefreshToken]: isSandbox
      ? current.production.refreshToken
      : "",
    [SETTING_KEYS.melhorEnvio.productionExpiresAt]: isSandbox
      ? String(current.production.expiresAt ?? "")
      : "",
  });
}

export { EMPTY_CREDS };
