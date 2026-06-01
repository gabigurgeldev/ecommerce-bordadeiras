import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendRegistrationEmail } from "@/lib/mail";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type RegisterUserResult =
  | { ok: true; userId: string }
  | { ok: false; code: "validation" | "exists"; message: string };

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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, code: "exists", message: "Este e-mail já está cadastrado." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: Role.USER },
  });

  try {
    await sendRegistrationEmail({ to: email, name });
  } catch (err) {
    console.error("[register] email failed", err);
  }

  return { ok: true, userId: user.id };
}
