import { z } from "zod";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { findAuthUserByEmail } from "@/lib/auth/find-auth-user";
import { createSignupConfirmation } from "@/lib/auth/signup-confirmation";
import { syncAuthAppMetadata } from "@/lib/auth/sync-auth-metadata";
import { upsertUserFromAuthUser } from "@/lib/auth/sync-user";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isDatabaseAvailable,
} from "@/lib/data/db-available";
import { findUserByEmail, upsertUserByEmail } from "@/lib/supabase/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Role } from "@/lib/types/database";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type RegisterUserResult =
  | { ok: true; userId: string }
  | { ok: false; code: "validation" | "exists" | "unavailable" | "configuration"; message: string };

function mapAuthSignupError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("confirmation email") || lower.includes("sending email") || lower.includes("smtp")) {
    return (
      "Não foi possível enviar o e-mail de confirmação. Verifique o SMTP do Supabase Auth (Stalwart) na VPS " +
      "ou SMTP_* no .env da aplicação."
    );
  }
  if (lower.includes("password")) {
    return "Senha rejeitada pelo servidor de autenticação. Use ao menos 8 caracteres.";
  }
  return "Não foi possível criar a conta. Verifique os dados e tente novamente.";
}

/** Fallback sem service role: signUp (depende do mailer GoTrue na VPS). */
async function createAuthUserWithSignUp(
  email: string,
  password: string,
  name: string,
): Promise<
  | { ok: true; authUser: SupabaseAuthUser }
  | { ok: false; code: "exists" | "validation"; message: string }
> {
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${appUrl}/auth/callback?next=/conta`,
    },
  });

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("already")) {
      return { ok: false, code: "exists", message: "Este e-mail já está cadastrado." };
    }

    if (lower.includes("confirmation email") || lower.includes("sending email")) {
      const admin = createAdminClient();
      if (admin) {
        const recovered = await findAuthUserByEmail(admin, email);
        if (recovered) {
          return { ok: true, authUser: recovered };
        }
      }
    }

    console.error("[register] supabase signUp", error.message);
    return {
      ok: false,
      code: "validation",
      message: mapAuthSignupError(error.message),
    };
  }

  const authUser = data.user;
  if (!authUser) {
    return {
      ok: false,
      code: "validation",
      message:
        "Cadastro iniciado, mas o Supabase não retornou o usuário. Confira a confirmação por e-mail no Auth.",
    };
  }

  return { ok: true, authUser };
}

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
  const password = parsed.data.password;

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

  const existing = await findUserByEmail(email);
  if (existing?.emailVerified) {
    return { ok: false, code: "exists", message: "Este e-mail já está cadastrado." };
  }

  const authResult = createAdminClient()
    ? await createSignupConfirmation(email, password, name)
    : await createAuthUserWithSignUp(email, password, name);

  if (!authResult.ok) {
    return {
      ok: false,
      code: authResult.code === "exists" ? "exists" : authResult.code,
      message: authResult.message,
    };
  }

  const authUser = authResult.authUser;

  const appUser =
    (await upsertUserFromAuthUser(authUser, { name, role: Role.USER })) ??
    (await upsertUserByEmail(email, { name, role: Role.USER, authUserId: authUser.id }));

  if (!appUser) {
    return {
      ok: false,
      code: "unavailable",
      message: DATABASE_UNAVAILABLE_MESSAGE,
    };
  }

  await syncAuthAppMetadata({
    email: appUser.email,
    prismaId: appUser.id,
    role: appUser.role,
    supabaseAuthId: authUser.id,
  });

  return { ok: true, userId: appUser.id };
}
