import { getSettings, setSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/settings-keys";
import { decodeMelhorEnvioTokenExpiry } from "@/lib/melhor-envio/token-utils";
import type { MelhorEnvioEnvironment } from "@/lib/melhor-envio/config";

export type MelhorEnvioEnvToken = {
  accessToken: string;
  expiresAt: number | null;
};

export type MelhorEnvioSettings = {
  useSandbox: boolean;
  sandbox: MelhorEnvioEnvToken;
  production: MelhorEnvioEnvToken;
};

const EMPTY_TOKEN: MelhorEnvioEnvToken = {
  accessToken: "",
  expiresAt: null,
};

const ALL_KEYS = Object.values(SETTING_KEYS.melhorEnvio);

function parseExpiresAt(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Math.floor(Number.parseFloat(raw));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function getMelhorEnvioSettings(): Promise<MelhorEnvioSettings> {
  const values = await getSettings([...ALL_KEYS]);

  const readEnv = (prefix: "sandbox" | "production"): MelhorEnvioEnvToken => {
    const isSandbox = prefix === "sandbox";
    return {
      accessToken:
        values[
          isSandbox
            ? SETTING_KEYS.melhorEnvio.sandboxAccessToken
            : SETTING_KEYS.melhorEnvio.productionAccessToken
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

export function getMelhorEnvioTokenForEnv(
  settings: MelhorEnvioSettings,
  env: MelhorEnvioEnvironment,
): MelhorEnvioEnvToken {
  return env === "sandbox" ? settings.sandbox : settings.production;
}

/** @deprecated Use getMelhorEnvioTokenForEnv */
export function getMelhorEnvioCredentialsForEnv(
  settings: MelhorEnvioSettings,
  env: MelhorEnvioEnvironment,
): MelhorEnvioEnvToken {
  return getMelhorEnvioTokenForEnv(settings, env);
}

export function isMelhorEnvioConnected(settings: MelhorEnvioSettings): boolean {
  const env = getActiveMelhorEnvioEnvironment(settings);
  const token = getMelhorEnvioTokenForEnv(settings, env);
  return Boolean(token.accessToken);
}

export async function saveMelhorEnvioAccessToken(
  env: MelhorEnvioEnvironment,
  accessToken: string,
): Promise<void> {
  const trimmed = accessToken.trim();
  const expiresAt = decodeMelhorEnvioTokenExpiry(trimmed);
  const current = await getMelhorEnvioSettings();
  const isSandbox = env === "sandbox";

  await setSettings({
    [SETTING_KEYS.melhorEnvio.sandboxAccessToken]: isSandbox
      ? trimmed
      : current.sandbox.accessToken,
    [SETTING_KEYS.melhorEnvio.sandboxExpiresAt]: isSandbox
      ? expiresAt != null
        ? String(expiresAt)
        : ""
      : String(current.sandbox.expiresAt ?? ""),
    [SETTING_KEYS.melhorEnvio.productionAccessToken]: isSandbox
      ? current.production.accessToken
      : trimmed,
    [SETTING_KEYS.melhorEnvio.productionExpiresAt]: isSandbox
      ? String(current.production.expiresAt ?? "")
      : expiresAt != null
        ? String(expiresAt)
        : "",
  });
}

export async function saveMelhorEnvioTokenSettings(data: {
  useSandbox: boolean;
  sandboxAccessToken: string;
  productionAccessToken: string;
}): Promise<void> {
  const current = await getMelhorEnvioSettings();
  const sandboxToken =
    data.sandboxAccessToken.trim() || current.sandbox.accessToken;
  const productionToken =
    data.productionAccessToken.trim() || current.production.accessToken;

  const sandboxExpires =
    sandboxToken !== current.sandbox.accessToken
      ? decodeMelhorEnvioTokenExpiry(sandboxToken)
      : current.sandbox.expiresAt;
  const productionExpires =
    productionToken !== current.production.accessToken
      ? decodeMelhorEnvioTokenExpiry(productionToken)
      : current.production.expiresAt;

  await setSettings({
    [SETTING_KEYS.melhorEnvio.useSandbox]: data.useSandbox ? "true" : "false",
    [SETTING_KEYS.melhorEnvio.sandboxAccessToken]: sandboxToken,
    [SETTING_KEYS.melhorEnvio.sandboxExpiresAt]:
      sandboxExpires != null ? String(sandboxExpires) : "",
    [SETTING_KEYS.melhorEnvio.productionAccessToken]: productionToken,
    [SETTING_KEYS.melhorEnvio.productionExpiresAt]:
      productionExpires != null ? String(productionExpires) : "",
  });
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
    [SETTING_KEYS.melhorEnvio.sandboxExpiresAt]: isSandbox
      ? ""
      : String(current.sandbox.expiresAt ?? ""),
    [SETTING_KEYS.melhorEnvio.productionAccessToken]: isSandbox
      ? current.production.accessToken
      : "",
    [SETTING_KEYS.melhorEnvio.productionExpiresAt]: isSandbox
      ? String(current.production.expiresAt ?? "")
      : "",
  });
}

export { EMPTY_TOKEN };
