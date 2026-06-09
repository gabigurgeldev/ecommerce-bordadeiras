import { isMpTestUserEmail, parseMpApiErrorPayload } from "@/lib/mercadopago-errors";

/** Formato válido: APP_USR- ou TEST- */
export function isValidMpCredentialFormat(credential: string): boolean {
  const trimmed = credential.trim();
  return trimmed.startsWith("APP_USR-") || trimmed.startsWith("TEST-");
}

export type MpTokenEnv = "test" | "production" | "unknown";

export type MpTokenProbe = {
  env: MpTokenEnv;
  liveMode: boolean | null;
};

/** Consulta a API do MP para saber se o token é de teste ou produção. */
export async function probeMpAccessTokenEnv(accessToken: string): Promise<MpTokenProbe> {
  const token = accessToken.trim();
  if (!token) return { env: "unknown", liveMode: null };

  try {
    const res = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as {
        live_mode?: boolean;
        test_data?: { test_user?: boolean };
        tags?: string[];
      };
      if (data.test_data?.test_user === true || data.tags?.includes("test_user")) {
        return { env: "test", liveMode: false };
      }
      if (data.live_mode === true) {
        return { env: "production", liveMode: true };
      }
      if (data.live_mode === false) {
        return { env: "test", liveMode: false };
      }
    }

    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
    const raw = parseMpApiErrorPayload(payload, res.status);
    if (/live credentials/i.test(raw)) {
      return { env: "production", liveMode: true };
    }
  } catch {
    /* network error */
  }

  return { env: "unknown", liveMode: null };
}

/** Valida se o token corresponde ao modo sandbox configurado. */
export async function verifyAccessTokenMatchesSandbox(
  accessToken: string,
  sandbox: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const probe = await probeMpAccessTokenEnv(accessToken);
  if (probe.env === "unknown") return { ok: true };

  if (sandbox && probe.env === "production") {
    return {
      ok: false,
      message:
        "Este Access Token é de PRODUÇÃO. Com sandbox ativo, cole Public Key e Access Token " +
        "da aba Teste (Credenciais de teste) do painel Mercado Pago.",
    };
  }

  if (!sandbox && probe.env === "test") {
    return {
      ok: false,
      message:
        "Este Access Token é de TESTE. Com sandbox desligado, cole as credenciais de produção " +
        "ou ative o modo sandbox.",
    };
  }

  return { ok: true };
}

/** Valida par de credenciais. */
export function validateMpCredentialPair(params: {
  publicKey: string;
  accessToken: string;
}): { valid: true } | { valid: false; message: string } {
  const publicKey = params.publicKey.trim();
  const accessToken = params.accessToken.trim();

  if (!publicKey) {
    return {
      valid: false,
      message: "Public Key não configurada. Cole a Public Key do painel Mercado Pago.",
    };
  }
  if (!accessToken) {
    return {
      valid: false,
      message: "Access Token não configurado. Cole o Access Token do painel Mercado Pago.",
    };
  }

  if (!isValidMpCredentialFormat(publicKey)) {
    return {
      valid: false,
      message: "Public Key inválida. Cole a chave do painel Mercado Pago (formato APP_USR-...).",
    };
  }

  if (!isValidMpCredentialFormat(accessToken)) {
    return {
      valid: false,
      message: "Access Token inválido. Cole o token do painel Mercado Pago (formato APP_USR-...).",
    };
  }

  return { valid: true };
}

/** MP exige e-mail de conta de teste: test_user_<id>@testuser.com */
export function resolveSandboxPayerEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (isMpTestUserEmail(trimmed)) return trimmed;
  const local = trimmed.split("@")[0]?.replace(/\W/g, "").slice(0, 20) || "buyer";
  return `test_user_${local}@testuser.com`;
}

export function mapMercadoPagoApiError(
  raw: string,
  sandbox?: boolean,
): string {
  if (/live credentials/i.test(raw)) {
    if (sandbox) {
      return (
        "Token de produção em uso com sandbox ativo. No admin, cole Public Key e Access Token " +
        "juntos da aba Teste do painel Mercado Pago e salve novamente."
      );
    }
    return (
      "Credenciais de teste em uso com sandbox desligado. " +
      "Cole as credenciais de produção ou ative o sandbox."
    );
  }
  return raw;
}
