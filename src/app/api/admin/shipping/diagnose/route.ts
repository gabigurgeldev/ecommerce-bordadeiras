import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { getMelhorEnvioSettings } from "@/lib/data/melhor-envio-settings";
import {
  getActiveMelhorEnvioEnvironment,
  isMelhorEnvioConnected,
  getMelhorEnvioTokenForEnv,
} from "@/lib/data/melhor-envio-settings";
import {
  resolveValidMelhorEnvioCredentials,
  probeMelhorEnvioTokenAccess,
} from "@/lib/melhor-envio/auth";
import { getShippingSettings } from "@/lib/data/shipping-settings";
import { normalizeCep } from "@/lib/shipping/cep";
import { getMelhorEnvioApiUrl, MELHOR_ENVIO_USER_AGENT } from "@/lib/melhor-envio/config";
import { melhorEnvioHttpsPost } from "@/lib/melhor-envio/http";

export const maxDuration = 30;

export async function GET() {
  const actor = await requireAdminApi();
  if (!actor) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 401 });
  }

  const steps: Array<{ step: string; ok: boolean; detail: string }> = [];

  // 1. Settings
  const [meSettings, shippingSettings] = await Promise.all([
    getMelhorEnvioSettings(),
    getShippingSettings(),
  ]);

  steps.push({
    step: "Configurações Melhor Envio",
    ok:
      Boolean(meSettings.sandbox.accessToken) ||
      Boolean(meSettings.production.accessToken),
    detail: `useSandbox=${meSettings.useSandbox} | sandbox=${meSettings.sandbox.accessToken ? "token presente" : "vazio"} | production=${meSettings.production.accessToken ? "token presente" : "vazio"}`,
  });

  // 2. CEP de origem
  const originCep = normalizeCep(shippingSettings.originCep);
  steps.push({
    step: "CEP de origem",
    ok: Boolean(originCep),
    detail: originCep
      ? `Configurado: ${shippingSettings.originCep}`
      : "Não configurado — defina em Admin → Configurações → Frete e Envio",
  });

  // 3. isMelhorEnvioConnected
  const connected = isMelhorEnvioConnected(meSettings);
  steps.push({
    step: "Token Melhor Envio (verificação local)",
    ok: connected,
    detail: connected
      ? `Ambiente ativo: ${getActiveMelhorEnvioEnvironment(meSettings)}`
      : "Nenhum token válido encontrado",
  });

  // 4. Resolve credentials
  const creds = await resolveValidMelhorEnvioCredentials();
  steps.push({
    step: "Resolver credenciais",
    ok: Boolean(creds),
    detail: creds
      ? `Usando ambiente: ${creds.env} | Token (primeiros 10 chars): ${creds.accessToken.slice(0, 10)}...`
      : "Nenhuma credencial válida — verifique token e expiração",
  });

  // 5. Probe ME API (real HTTP call)
  if (creds) {
    const probe = await probeMelhorEnvioTokenAccess(
      creds.env,
      creds.accessToken,
    );
    steps.push({
      step: `Testar conexão ME API (${creds.env})`,
      ok: probe.ok,
      detail: probe.message,
    });
  } else {
    steps.push({
      step: "Testar conexão ME API",
      ok: false,
      detail: "Pulado — sem credenciais",
    });
  }

  // 6. Cotação teste (CEP fixo de SP → 01001000)
  if (creds && originCep) {
    const testDestCep = "01001000";
    const url = getMelhorEnvioApiUrl(creds.env, "/api/v2/me/shipment/calculate");
    const testBody = JSON.stringify({
      from: { postal_code: originCep },
      to: { postal_code: testDestCep },
      products: [
        {
          id: "diag-product",
          width: 11,
          height: 2,
          length: 16,
          weight: 0.3,
          insurance_value: 10,
          quantity: 1,
        },
      ],
    });

    try {
      const res = await melhorEnvioHttpsPost(
        url,
        testBody,
        {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": MELHOR_ENVIO_USER_AGENT,
          Authorization: `Bearer ${creds.accessToken}`,
        },
        15_000,
      );

      let bodyPreview = res.body.slice(0, 600);
      let hasValidOptions = false;
      try {
        const data = JSON.parse(res.body);
        if (Array.isArray(data)) {
          const valid = (data as Array<{ error?: string; price?: string; custom_price?: string; name?: string }>).filter(
            (item) => !item.error && (item.custom_price || item.price),
          );
          hasValidOptions = valid.length > 0;
          bodyPreview = valid.length > 0
            ? `${valid.length} opção(ões) válida(s): ${valid.map((v) => v.name).join(", ")}`
            : `0 opções válidas. Erros: ${(data as Array<{ error?: string }>).filter((i) => i.error).map((i) => i.error).join("; ").slice(0, 200)}`;
        }
      } catch {
        /* non-JSON */
      }

      steps.push({
        step: `Cotação teste (${originCep} → ${testDestCep})`,
        ok: res.status >= 200 && res.status < 300 && hasValidOptions,
        detail: `HTTP ${res.status} | ${bodyPreview}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      steps.push({
        step: `Cotação teste (${originCep} → ${testDestCep})`,
        ok: false,
        detail: `Erro de rede: ${msg}`,
      });
    }
  } else {
    steps.push({
      step: "Cotação teste",
      ok: false,
      detail: "Pulado — sem credenciais ou CEP de origem",
    });
  }

  const allOk = steps.every((s) => s.ok);
  return NextResponse.json({ allOk, steps });
}
