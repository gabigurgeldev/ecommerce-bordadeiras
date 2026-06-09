import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateUser,
  resolveLoginRedirect,
} from "@/lib/authenticate-user";
import { getClientIp, jsonError, parseBody } from "@/lib/api-utils";
import { validateCsrfToken, CSRF_HEADER } from "@/lib/csrf";
import { rateLimitAuth } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  callbackUrl: z.string().optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = await rateLimitAuth(`login:${ip}`);
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

  const { email, password, callbackUrl } = parsed.data;
  const result = await authenticateUser(email, password);

  if (!result.ok) {
    const status =
      result.reason === "unverified"
        ? 403
        : result.reason === "configuration" || result.reason === "unavailable"
          ? 503
          : 401;
    return NextResponse.json(
      {
        error: result.message,
        code: result.reason,
        email: result.reason === "unverified" ? result.email : undefined,
      },
      { status },
    );
  }

  const redirect = resolveLoginRedirect(callbackUrl ?? "/", result.user);
  return NextResponse.json({ ok: true, redirect });
}
