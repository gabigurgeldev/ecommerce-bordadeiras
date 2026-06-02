import { randomInt } from "crypto";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isDatabaseAvailable,
} from "@/lib/data/db-available";
import { prisma } from "@/lib/prisma";
import { sanitizeEmail } from "@/lib/sanitize";
import { sendVerificationEmail } from "@/lib/mail";

const CODE_EXPIRY_MS = 15 * 60 * 1000;

function generateCode(): string {
  return String(randomInt(100000, 1_000_000));
}

export async function createEmailVerificationCode(email: string, name: string): Promise<void> {
  const identifier = sanitizeEmail(email);
  const token = generateCode();
  const expires = new Date(Date.now() + CODE_EXPIRY_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  await sendVerificationEmail({ to: identifier, name, code: token });
}

export type VerifyEmailResult =
  | { ok: true }
  | { ok: false; code: "invalid" | "expired" | "already" | "unavailable"; message: string };

export async function verifyEmailCode(email: string, code: string): Promise<VerifyEmailResult> {
  const identifier = sanitizeEmail(email);
  const token = code.trim();

  if (!(await isDatabaseAvailable())) {
    return { ok: false, code: "unavailable", message: DATABASE_UNAVAILABLE_MESSAGE };
  }

  if (!/^\d{6}$/.test(token)) {
    return { ok: false, code: "invalid", message: "Código inválido. Use os 6 dígitos enviados por e-mail." };
  }

  const user = await prisma.user.findUnique({ where: { email: identifier } });
  if (!user) {
    return { ok: false, code: "invalid", message: "E-mail não encontrado." };
  }
  if (user.emailVerified) {
    return { ok: false, code: "already", message: "Este e-mail já foi verificado. Faça login." };
  }

  const record = await prisma.verificationToken.findFirst({
    where: { identifier, token },
  });

  if (!record) {
    return { ok: false, code: "invalid", message: "Código incorreto. Verifique e tente novamente." };
  }
  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return {
      ok: false,
      code: "expired",
      message: "Código expirado. Solicite um novo código abaixo.",
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier } }),
  ]);

  return { ok: true };
}

export async function resendEmailVerificationCode(
  email: string,
): Promise<{ ok: boolean; message?: string }> {
  const identifier = sanitizeEmail(email);

  if (!(await isDatabaseAvailable())) {
    return { ok: false, message: DATABASE_UNAVAILABLE_MESSAGE };
  }

  const user = await prisma.user.findUnique({ where: { email: identifier } });
  if (!user || user.emailVerified) return { ok: true };

  await createEmailVerificationCode(identifier, user.name ?? identifier);
  return { ok: true };
}
