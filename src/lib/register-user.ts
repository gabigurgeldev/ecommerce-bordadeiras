import { Role } from "@prisma/client";
import { z } from "zod";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isDatabaseAvailable,
} from "@/lib/data/db-available";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createEmailVerificationCode } from "@/lib/email-verification";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type RegisterUserResult =
  | { ok: true; userId: string }
  | { ok: false; code: "validation" | "exists" | "unavailable"; message: string };

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterUserResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      message: "Dados inválidos. Use nome (2+ caracteres), e-mail válido e senha com 8+ caracteres.",
    };
  }

  const email = sanitizeEmail(parsed.data.email);
  const name = sanitizeText(parsed.data.name);

  if (!(await isDatabaseAvailable())) {
    return {
      ok: false,
      code: "unavailable",
      message: DATABASE_UNAVAILABLE_MESSAGE,
    };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, code: "exists", message: "Este e-mail já está cadastrado." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: Role.USER },
  });

  try {
    await createEmailVerificationCode(email, name);
  } catch (err) {
    console.error("[register] verification email failed", err);
  }

  return { ok: true, userId: user.id };
}
