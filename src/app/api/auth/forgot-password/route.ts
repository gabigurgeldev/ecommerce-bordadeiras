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

  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
    });
  } catch (err) {
    console.error("[forgot-password] supabase reset", err);
  }

  return NextResponse.json({ message: "If the email exists, a reset link was sent." });
}
