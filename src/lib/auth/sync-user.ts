import type { User as SupabaseUser } from "@supabase/supabase-js";
import { isDatabaseAvailable } from "@/lib/data/db-available";
import {
  findUserByAuthId,
  findUserByEmail,
  upsertUserFromAuth,
} from "@/lib/supabase/db";
import { Role, type User } from "@/lib/types/database";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Links Supabase Auth user to app `User` row. */
export async function upsertUserFromAuthUser(
  authUser: Pick<SupabaseUser, "id" | "email" | "user_metadata" | "email_confirmed_at">,
  options?: { name?: string; role?: Role },
): Promise<User | null> {
  if (!(await isDatabaseAvailable())) return null;
  const email = authUser.email?.trim();
  if (!email) return null;

  const normalized = normalizeEmail(email);
  const metaName =
    typeof authUser.user_metadata?.name === "string"
      ? sanitizeText(authUser.user_metadata.name)
      : undefined;
  const name = options?.name ?? metaName ?? null;
  const emailVerified = authUser.email_confirmed_at
    ? new Date(authUser.email_confirmed_at)
    : undefined;

  return upsertUserFromAuth({
    email: normalized,
    authUserId: authUser.id,
    name,
    emailVerified,
    role: options?.role,
  });
}

export async function findUserByEmailAddress(email: string): Promise<User | null> {
  if (!(await isDatabaseAvailable())) return null;
  return findUserByEmail(sanitizeEmail(email));
}

export async function findUserByAuthUserId(authUserId: string): Promise<User | null> {
  if (!(await isDatabaseAvailable())) return null;
  return findUserByAuthId(authUserId);
}
