import { NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/app-url";
import {
  consumeMelhorEnvioOAuthPending,
  getActiveMelhorEnvioEnvironment,
  getMelhorEnvioSettings,
} from "@/lib/data/melhor-envio-settings";
import {
  exchangeMelhorEnvioCode,
  MelhorEnvioTokenError,
} from "@/lib/melhor-envio/auth";
import { getMelhorEnvioRedirectUri } from "@/lib/melhor-envio/config";

function settingsRedirect(params: Record<string, string>) {
  const origin = getAppOrigin();
  const query = new URLSearchParams(params);
  return NextResponse.redirect(
    `${origin}/admin/configuracoes?${query.toString()}#shipping`,
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return settingsRedirect({
      melhorEnvio: "error",
      message: error,
    });
  }

  if (!code) {
    return settingsRedirect({
      melhorEnvio: "error",
      message: "missing_code",
    });
  }

  const pending = await consumeMelhorEnvioOAuthPending(state);
  const settings = await getMelhorEnvioSettings();
  const env = pending?.env ?? getActiveMelhorEnvioEnvironment(settings);
  const redirectUri = pending?.redirectUri ?? getMelhorEnvioRedirectUri();

  if (!pending) {
    console.warn("[melhor-envio/callback] OAuth pending session missing or expired", {
      state,
      env,
      redirectUri,
    });
  }

  try {
    await exchangeMelhorEnvioCode(env, code, redirectUri);
    return settingsRedirect({ melhorEnvio: "connected" });
  } catch (err) {
    console.error("[melhor-envio/callback]", err);

    const params: Record<string, string> = {
      melhorEnvio: "error",
      message: "token_exchange_failed",
    };

    if (err instanceof MelhorEnvioTokenError) {
      if (err.code) params.detail = err.code;
      if (err.description && !err.description.trimStart().startsWith("<")) {
        params.description = err.description.slice(0, 220);
      }
      console.error("[melhor-envio/callback] token error", {
        env,
        status: err.status,
        code: err.code,
        redirectUri,
        hadPending: Boolean(pending),
      });
    } else if (err instanceof Error && err.message) {
      params.description = err.message.slice(0, 220);
    }

    return settingsRedirect(params);
  }
}
