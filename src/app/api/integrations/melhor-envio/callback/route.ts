import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/app-url";
import {
  getActiveMelhorEnvioEnvironment,
  getMelhorEnvioSettings,
} from "@/lib/data/melhor-envio-settings";
import {
  exchangeMelhorEnvioCode,
  ME_OAUTH_ENV_COOKIE,
  ME_OAUTH_REDIRECT_COOKIE,
  MelhorEnvioTokenError,
} from "@/lib/melhor-envio/auth";
import { getMelhorEnvioRedirectUri } from "@/lib/melhor-envio/config";
import type { MelhorEnvioEnvironment } from "@/lib/melhor-envio/config";

function settingsRedirect(params: Record<string, string>) {
  const origin = getAppOrigin();
  const query = new URLSearchParams(params);
  return NextResponse.redirect(
    `${origin}/admin/configuracoes?${query.toString()}#shipping`,
  );
}

function resolveOAuthEnvironment(
  cookieEnv: string | undefined,
  state: string | null,
  settingsEnv: MelhorEnvioEnvironment,
): MelhorEnvioEnvironment {
  if (cookieEnv === "production" || cookieEnv === "sandbox") return cookieEnv;
  if (state === "production" || state === "sandbox") return state;
  return settingsEnv;
}

function clearOAuthCookies(response: NextResponse) {
  response.cookies.set(ME_OAUTH_ENV_COOKIE, "", { maxAge: 0, path: "/" });
  response.cookies.set(ME_OAUTH_REDIRECT_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    const response = settingsRedirect({
      melhorEnvio: "error",
      message: error,
    });
    clearOAuthCookies(response);
    return response;
  }

  if (!code) {
    const response = settingsRedirect({
      melhorEnvio: "error",
      message: "missing_code",
    });
    clearOAuthCookies(response);
    return response;
  }

  const cookieStore = await cookies();
  const cookieEnv = cookieStore.get(ME_OAUTH_ENV_COOKIE)?.value;
  const cookieRedirect = cookieStore.get(ME_OAUTH_REDIRECT_COOKIE)?.value;
  const settings = await getMelhorEnvioSettings();
  const env = resolveOAuthEnvironment(
    cookieEnv,
    state,
    getActiveMelhorEnvioEnvironment(settings),
  );
  const redirectUri = cookieRedirect || getMelhorEnvioRedirectUri();

  try {
    await exchangeMelhorEnvioCode(env, code, redirectUri);
    const response = settingsRedirect({ melhorEnvio: "connected" });
    clearOAuthCookies(response);
    return response;
  } catch (err) {
    console.error("[melhor-envio/callback]", err);

    const params: Record<string, string> = {
      melhorEnvio: "error",
      message: "token_exchange_failed",
    };

    if (err instanceof MelhorEnvioTokenError) {
      if (err.code) params.detail = err.code;
      if (err.description) params.description = err.description.slice(0, 180);
    } else if (err instanceof Error && err.message) {
      params.description = err.message.slice(0, 180);
    }

    const response = settingsRedirect(params);
    clearOAuthCookies(response);
    return response;
  }
}
