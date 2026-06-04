import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitAuth } from "@/lib/rate-limit";
import { sanitizeEmail } from "@/lib/sanitize";
import { getClientIp, jsonError, parseBody } from "@/lib/api-utils";
import { validateCsrfToken, CSRF_HEADER } from "@/lib/csrf";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = await rateLimitAuth(`forgot:${ip}`);
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

  const email = sanitizeEmail(parsed.data.email);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("[forgot-password] supabase.auth.resetPasswordForEmail", error.message);
    const lower = error.message.toLowerCase();
    if (lower.includes("rate") || lower.includes("too many")) {
      return jsonError("Muitas tentativas. Aguarde alguns minutos.", 429);
    }
    if (lower.includes("sending email") || lower.includes("smtp")) {
      return jsonError(
        "Não foi possível enviar o e-mail de recuperação. Verifique o SMTP do Supabase Auth na VPS.",
        503,
      );
    }
  }

  return NextResponse.json({ message: "If the email exists, a reset link was sent." });
}
