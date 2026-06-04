import { createClient } from "@/lib/supabase/server";
import { findUserByEmailAddress, upsertUserFromAuthUser } from "@/lib/auth/sync-user";
import type { Role } from "@/lib/types/database";

export type AppSessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
};

export type AppSession = {
  user: AppSessionUser;
};

/** Server session from Supabase `getUser()` + app User role (never trust client getSession alone). */
export async function auth(): Promise<AppSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) return null;

    let appUser = await findUserByEmailAddress(user.email);
    if (!appUser) {
      appUser = await upsertUserFromAuthUser(user);
    }
    if (!appUser) return null;

    const sessionUser: AppSessionUser = {
      id: appUser.id,
      email: appUser.email,
      name: appUser.name,
      role: appUser.role,
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
