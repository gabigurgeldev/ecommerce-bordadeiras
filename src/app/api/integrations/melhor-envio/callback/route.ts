import { NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/app-url";
import { exchangeMelhorEnvioCode } from "@/lib/melhor-envio/auth";
import type { MelhorEnvioEnvironment } from "@/lib/melhor-envio/config";

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

  const env: MelhorEnvioEnvironment =
    state === "production" ? "production" : "sandbox";

  try {
    await exchangeMelhorEnvioCode(env, code);
    return settingsRedirect({ melhorEnvio: "connected" });
  } catch (err) {
    console.error("[melhor-envio/callback]", err);
    return settingsRedirect({
      melhorEnvio: "error",
      message: "token_exchange_failed",
    });
  }
}
