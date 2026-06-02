import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitAuth } from "@/lib/rate-limit";
import { validateCsrfToken, CSRF_HEADER } from "@/lib/csrf";
import { getClientIp, jsonError, parseBody } from "@/lib/api-utils";
import { verifyEmailCode } from "@/lib/email-verification";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = await rateLimitAuth(`verify-email:${ip}`);
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

  const result = await verifyEmailCode(parsed.data.email, parsed.data.code);
  if (!result.ok) {
    const status = result.code === "already" ? 409 : 400;
    return jsonError(result.message, status);
  }

  return NextResponse.json({ message: "Email verified" });
}
