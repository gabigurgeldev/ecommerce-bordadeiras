import { Role, type User } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { isDatabaseAvailable } from "@/lib/data/db-available";
import { prisma } from "@/lib/prisma";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Links Supabase Auth user to Prisma `User` by email and `authUserId` (RLS). */
export async function upsertPrismaUserFromAuth(
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

  const authUserId = authUser.id;

  const existing =
    (await prisma.user.findUnique({ where: { authUserId } })) ??
    (await prisma.user.findUnique({ where: { email: normalized } }));

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        authUserId,
        ...(name ? { name } : {}),
        ...(emailVerified ? { emailVerified } : {}),
        ...(options?.role ? { role: options.role } : {}),
      },
    });
  }

  return prisma.user.create({
    data: {
      email: normalized,
      authUserId,
      name,
      emailVerified,
      role: options?.role ?? Role.USER,
    },
  });
}

export async function findPrismaUserByEmail(email: string): Promise<User | null> {
  if (!(await isDatabaseAvailable())) return null;
  const normalized = sanitizeEmail(email);
  return prisma.user.findUnique({ where: { email: normalized } });
}
