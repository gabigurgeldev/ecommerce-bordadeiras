import type { Role } from "@prisma/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/auth/find-auth-user";

/** Mirrors Prisma id/role into Supabase JWT `app_metadata` for middleware (Edge-safe). */
export async function syncAuthAppMetadata(params: {
  email: string;
  prismaId: string;
  role: Role;
  supabaseAuthId?: string;
}) {
  const admin = createAdminClient();
  if (!admin) return;

  const email = params.email.trim().toLowerCase();
  const authUser =
    params.supabaseAuthId != null
      ? { id: params.supabaseAuthId }
      : await findAuthUserByEmail(admin, email);

  if (!authUser) return;

  await admin.auth.admin.updateUserById(authUser.id, {
    app_metadata: { prisma_id: params.prismaId, role: params.role },
  });
}
