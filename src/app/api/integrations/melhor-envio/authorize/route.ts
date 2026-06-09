import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/app-url";
import { getAdminActor } from "@/lib/admin-auth";
import {
  getActiveMelhorEnvioEnvironment,
  getMelhorEnvioCredentialsForEnv,
  getMelhorEnvioSettings,
  saveMelhorEnvioOAuthPending,
} from "@/lib/data/melhor-envio-settings";
import { buildMelhorEnvioAuthorizationUrl } from "@/lib/melhor-envio/auth";
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
  const oauthState = randomUUID();

  await saveMelhorEnvioOAuthPending({
    state: oauthState,
    env,
    redirectUri,
  });

  const url = buildMelhorEnvioAuthorizationUrl(
    env,
    creds.clientId,
    redirectUri,
    oauthState,
  );

  return NextResponse.redirect(url);
}
