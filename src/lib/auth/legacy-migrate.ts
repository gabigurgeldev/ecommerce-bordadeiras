import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/auth/find-auth-user";
import { verifyUserCredentials } from "@/lib/verify-credentials";

/**
 * One-time migration: Prisma users with bcrypt `passwordHash` but no Supabase Auth account.
 * On successful bcrypt verify, creates the Supabase user with the same password.
 */
export async function migrateLegacyUserToSupabase(
  email: string,
  password: string,
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const prismaUser = await verifyUserCredentials(email, password);
  if (!prismaUser?.passwordHash) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findAuthUserByEmail(admin, normalizedEmail);

  const appMetadata = {
    prisma_id: prismaUser.id,
    role: prismaUser.role,
  };

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      app_metadata: appMetadata,
    });
    return !error;
  }

  const { error } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: Boolean(prismaUser.emailVerified),
    user_metadata: { name: prismaUser.name ?? undefined },
    app_metadata: appMetadata,
  });

  return !error;
}
