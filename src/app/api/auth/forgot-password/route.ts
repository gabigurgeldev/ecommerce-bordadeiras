import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimitAuth } from "@/lib/rate-limit";
import { sanitizeEmail } from "@/lib/sanitize";
import { getClientIp, jsonError, parseBody } from "@/lib/api-utils";
import { formatMailError, MailNotConfiguredError, sendPasswordResetEmail } from "@/lib/mail";
import { validateCsrfToken, CSRF_HEADER } from "@/lib/csrf";

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
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid email enumeration
  if (!user?.passwordHash) {
    return NextResponse.json({ message: "If the email exists, a reset link was sent." });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail({
      to: email,
      name: user.name ?? email,
      resetUrl,
    });
  } catch (err) {
    if (err instanceof MailNotConfiguredError) {
      console.error("[forgot-password]", err.message);
    } else {
      console.error("[forgot-password] email failed", formatMailError(err));
    }
  }

  return NextResponse.json({ message: "If the email exists, a reset link was sent." });
}
