import { Role } from "@prisma/client";
import { z } from "zod";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isDatabaseAvailable,
} from "@/lib/data/db-available";
import { prisma } from "@/lib/prisma";
import { upsertPrismaUserFromAuth } from "@/lib/auth/sync-prisma-user";
import { createClient } from "@/lib/supabase/server";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type RegisterUserResult =
  | { ok: true; userId: string }
  | { ok: false; code: "validation" | "exists" | "unavailable" | "configuration"; message: string };

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

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  ) {
    return {
      ok: false,
      code: "configuration",
      message: "Supabase Auth não configurado no servidor.",
    };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, code: "exists", message: "Este e-mail já está cadastrado." };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password: parsed.data.password,
    options: {
      data: { name },
      emailRedirectTo: `${appUrl}/auth/callback?next=/conta`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { ok: false, code: "exists", message: "Este e-mail já está cadastrado." };
    }
    console.error("[register] supabase signUp", error.message);
    return {
      ok: false,
      code: "validation",
      message: "Não foi possível criar a conta. Verifique os dados e tente novamente.",
    };
  }

  const authUser = data.user;
  if (!authUser) {
    return {
      ok: false,
      code: "validation",
      message: "Cadastro iniciado. Confira seu e-mail para confirmar a conta.",
    };
  }

  const prismaUser =
    (await upsertPrismaUserFromAuth(authUser, { name, role: Role.USER })) ??
    (await prisma.user.create({
      data: { email, name, role: Role.USER },
    }));

  return { ok: true, userId: prismaUser.id };
}
