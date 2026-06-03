import { Role, type User } from "@prisma/client";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isDatabaseAvailable,
} from "@/lib/data/db-available";
import { migrateLegacyUserToSupabase } from "@/lib/auth/legacy-migrate";
import { syncAuthAppMetadata } from "@/lib/auth/sync-auth-metadata";
import {
  findPrismaUserByEmail,
  upsertPrismaUserFromAuth,
} from "@/lib/auth/sync-prisma-user";
import { createClient } from "@/lib/supabase/server";
import { verifyUserCredentials } from "@/lib/verify-credentials";

function isAdminEmail(email: string) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return false;
  return email.trim().toLowerCase() === adminEmail;
}

export function isAdminUser(user: { email: string; role: Role }) {
  return user.role === Role.ADMIN || isAdminEmail(user.email);
}

export type AuthenticateResult =
  | { ok: true; user: User }
  | { ok: false; reason: "invalid"; message: string }
  | { ok: false; reason: "unverified"; email: string; message: string }
  | { ok: false; reason: "unavailable"; message: string }
  | { ok: false; reason: "configuration"; message: string };

function isEmailConfirmed(
  prismaUser: User,
  supabaseConfirmedAt?: string | null,
): boolean {
  if (prismaUser.emailVerified) return true;
  if (supabaseConfirmedAt) return true;
  return false;
}

/** Supabase sign-in + Prisma sync; legacy bcrypt users migrated on first successful login. */
export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthenticateResult> {
  if (!(await isDatabaseAvailable())) {
    return {
      ok: false,
      reason: "unavailable",
      message: DATABASE_UNAVAILABLE_MESSAGE,
    };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  ) {
    return {
      ok: false,
      reason: "configuration",
      message:
        "Supabase Auth não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const supabase = await createClient();
  let signIn = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (signIn.error) {
    const legacy = await verifyUserCredentials(email, password);
    if (legacy?.passwordHash) {
      const migrated = await migrateLegacyUserToSupabase(email, password);
      if (migrated) {
        signIn = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
      }
    }
  }

  if (signIn.error || !signIn.data.user) {
    return {
      ok: false,
      reason: "invalid",
      message: "E-mail ou senha incorretos.",
    };
  }

  const authUser = signIn.data.user;
  let prismaUser = await findPrismaUserByEmail(authUser.email ?? email);
  if (!prismaUser) {
    prismaUser = await upsertPrismaUserFromAuth(authUser);
  }
  if (!prismaUser) {
    return {
      ok: false,
      reason: "unavailable",
      message: DATABASE_UNAVAILABLE_MESSAGE,
    };
  }

  await syncAuthAppMetadata({
    email: prismaUser.email,
    prismaId: prismaUser.id,
    role: prismaUser.role,
    supabaseAuthId: authUser.id,
  });
  await supabase.auth.refreshSession();

  const admin = (await import("@/lib/supabase/admin")).createAdminClient();
  if (admin) {
    await admin.auth.admin.updateUserById(authUser.id, {
      app_metadata: { prisma_id: prismaUser.id, role: prismaUser.role },
    });
    await supabase.auth.refreshSession();
  }

  if (!isEmailConfirmed(prismaUser, authUser.email_confirmed_at) && !isAdminUser(prismaUser)) {
    return {
      ok: false,
      reason: "unverified",
      email: prismaUser.email,
      message:
        "E-mail não verificado. Confira sua caixa de entrada (incluindo SPAM) ou use o link enviado pelo Supabase.",
    };
  }

  return { ok: true, user: prismaUser };
}

export function resolveLoginRedirect(
  callbackUrl: string,
  user: { email: string; role: Role },
): string {
  const safe =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";
  const isDefault = !safe || safe === "/";
  if (isAdminUser(user) && isDefault) return "/admin";
  return safe || "/";
}
