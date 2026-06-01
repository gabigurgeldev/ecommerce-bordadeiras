import { NextResponse } from "next/server";
import { rateLimitAuth } from "@/lib/rate-limit";
import { validateCsrfToken, CSRF_HEADER } from "@/lib/csrf";
import { getClientIp, jsonError } from "@/lib/api-utils";
import { registerUser } from "@/lib/register-user";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = await rateLimitAuth(`register:${ip}`);
  if (!limited.success) return jsonError("Too many requests", 429);

  const csrfOk = await validateCsrfToken(request.headers.get(CSRF_HEADER));
  if (!csrfOk) return jsonError("Invalid CSRF token", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }

  if (!body || typeof body !== "object") {
    return jsonError("Invalid body");
  }

  const { name, email, password } = body as Record<string, unknown>;
  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return jsonError("Validation failed", 422);
  }

  const result = await registerUser({ name, email, password });
  if (!result.ok) {
    if (result.code === "exists") return jsonError("Email already registered", 409);
    return jsonError(result.message, 422);
  }

  return NextResponse.json(
    { id: result.userId, email, message: "Account created" },
    { status: 201 },
  );
}
