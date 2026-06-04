import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitAuth } from "@/lib/rate-limit";
import { validateCsrfToken, CSRF_HEADER } from "@/lib/csrf";
import { getClientIp, jsonError, parseBody } from "@/lib/api-utils";
import { resendEmailVerificationCode } from "@/lib/email-verification";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = await rateLimitAuth(`resend-verify:${ip}`);
  if (!limited.success) return jsonError("Too many requests", 429);

  const csrfOk = await validateCsrfToken(request.headers.get(CSRF_HEADER));
  if (!csrfOk) return jsonError("Invalid CSRF token", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }

  const parsed = parseBody(schema, body);
  if (!parsed.success) return parsed.response;

  try {
    const result = await resendEmailVerificationCode(parsed.data.email);
    if (!result.ok) {
      return jsonError(result.message ?? "Serviço indisponível.", 503);
    }
  } catch (err) {
    console.error("[resend-verification] failed", err);
    return jsonError(
      "Não foi possível reenviar o e-mail. Verifique o SMTP do Supabase Auth na VPS.",
      503,
    );
  }

  return NextResponse.json({
    message: "Se o e-mail estiver pendente, o Supabase enviou um novo código.",
  });
}
