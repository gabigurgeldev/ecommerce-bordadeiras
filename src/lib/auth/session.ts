import type { Role } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { findPrismaUserByEmail, upsertPrismaUserFromAuth } from "@/lib/auth/sync-prisma-user";
export type AppSessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
};

export type AppSession = {
  user: AppSessionUser;
};

/** Server session from Supabase `getUser()` + Prisma role (never trust client getSession alone). */
export async function auth(): Promise<AppSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) return null;

    let prismaUser = await findPrismaUserByEmail(user.email);
    if (!prismaUser) {
      prismaUser = await upsertPrismaUserFromAuth(user);
    }
    if (!prismaUser) return null;

    const sessionUser: AppSessionUser = {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      role: prismaUser.role,
    };

    return { user: sessionUser };
  } catch {
    return null;
  }
}

export async function getSession() {
  return auth();
}

/** Session user for route handlers and server actions. */
export async function getSessionUser(): Promise<AppSessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}
