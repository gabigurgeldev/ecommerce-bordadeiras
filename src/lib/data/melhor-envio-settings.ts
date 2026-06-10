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

/** Quando a chave não foi salva: sandbox no dev, produção no deploy. */
function parseUseSandbox(raw: string | undefined): boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return process.env.NODE_ENV !== "production";
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
    useSandbox: parseUseSandbox(values[SETTING_KEYS.melhorEnvio.useSandbox]),
    sandbox: readEnv("sandbox"),
    production: readEnv("production"),
  };
}

/** Ambiente preferido conforme toggle (ou NODE_ENV quando ainda não salvo). */
export function getPreferredMelhorEnvioEnvironment(
  settings: MelhorEnvioSettings,
): MelhorEnvioEnvironment {
  return settings.useSandbox ? "sandbox" : "production";
}

/**
 * Ambiente efetivo para chamadas à API: usa o preferido se houver token;
 * caso contrário, tenta o outro ambiente (evita sandbox vazio em produção).
 */
export function getActiveMelhorEnvioEnvironment(
  settings: MelhorEnvioSettings,
): MelhorEnvioEnvironment {
  const preferred = getPreferredMelhorEnvioEnvironment(settings);
  if (getMelhorEnvioTokenForEnv(settings, preferred).accessToken) {
    return preferred;
  }

  const alternate: MelhorEnvioEnvironment =
    preferred === "sandbox" ? "production" : "sandbox";
  if (getMelhorEnvioTokenForEnv(settings, alternate).accessToken) {
    console.warn(
      `[melhor-envio] Token ausente em ${preferred}; usando ambiente ${alternate}.`,
    );
    return alternate;
  }

  return preferred;
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

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

function isMelhorEnvioTokenUsable(creds: MelhorEnvioEnvToken): boolean {
  if (!creds.accessToken) return false;
  const expiresAt =
    creds.expiresAt ?? decodeMelhorEnvioTokenExpiry(creds.accessToken);
  if (!expiresAt) return true;
  return expiresAt - TOKEN_EXPIRY_BUFFER_MS > Date.now();
}

export function isMelhorEnvioConnected(settings: MelhorEnvioSettings): boolean {
  return (
    isMelhorEnvioTokenUsable(settings.sandbox) ||
    isMelhorEnvioTokenUsable(settings.production)
  );
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
