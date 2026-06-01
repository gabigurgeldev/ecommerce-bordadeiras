import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { rateLimitAuth } from "@/lib/rate-limit";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";
import { getClientIp, jsonError, parseBody } from "@/lib/api-utils";
import { sendRegistrationEmail } from "@/lib/mail";
import { validateCsrfToken, CSRF_HEADER } from "@/lib/csrf";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

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

  const parsed = parseBody(schema, body);
  if (!parsed.success) return parsed.response;

  const email = sanitizeEmail(parsed.data.email);
  const name = sanitizeText(parsed.data.name);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return jsonError("Email already registered", 409);

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: "USER" },
  });

  try {
    await sendRegistrationEmail({ to: email, name });
  } catch (err) {
    console.error("[register] email failed", err);
  }

  return NextResponse.json(
    { id: user.id, email: user.email, message: "Account created" },
    { status: 201 }
  );
}
