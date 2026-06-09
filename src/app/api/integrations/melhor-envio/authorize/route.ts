import { NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/app-url";
import { getAdminActor } from "@/lib/admin-auth";
import {
  getActiveMelhorEnvioEnvironment,
  getMelhorEnvioCredentialsForEnv,
  getMelhorEnvioSettings,
} from "@/lib/data/melhor-envio-settings";
import {
  buildMelhorEnvioAuthorizationUrl,
  ME_OAUTH_ENV_COOKIE,
  ME_OAUTH_REDIRECT_COOKIE,
} from "@/lib/melhor-envio/auth";
import { getMelhorEnvioRedirectUri } from "@/lib/melhor-envio/config";

function settingsRedirect(params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return NextResponse.redirect(
    `${getAppOrigin()}/admin/configuracoes?${query.toString()}#shipping`,
  );
}

export async function GET() {
  const actor = await getAdminActor();
  if (!actor) {
    return settingsRedirect({ melhorEnvio: "error", message: "unauthorized" });
  }

  const settings = await getMelhorEnvioSettings();
  const env = getActiveMelhorEnvioEnvironment(settings);
  const creds = getMelhorEnvioCredentialsForEnv(settings, env);

  if (!creds.clientId) {
    return settingsRedirect({
      melhorEnvio: "error",
      message: "missing_client_id",
    });
  }

  if (!creds.clientSecret) {
    return settingsRedirect({
      melhorEnvio: "error",
      message: "missing_client_secret",
    });
  }

  const redirectUri = getMelhorEnvioRedirectUri();
  const url = buildMelhorEnvioAuthorizationUrl(env, creds.clientId, redirectUri);
  const response = NextResponse.redirect(url);

  const secure = getAppOrigin().startsWith("https://");
  const cookieOptions = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };

  response.cookies.set(ME_OAUTH_ENV_COOKIE, env, cookieOptions);
  response.cookies.set(ME_OAUTH_REDIRECT_COOKIE, redirectUri, cookieOptions);

  return response;
}
