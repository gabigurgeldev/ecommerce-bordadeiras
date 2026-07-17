import { createAdminClient } from "@/lib/supabase/admin";
import { Role } from "@/lib/types/database";

const TABLES_USER = "User";

/** Resolve app role from DB so middleware matches server `auth()` / `requireAdmin`. */
export async function resolveAppRoleForEmail(
  email: string,
  jwtRole: Role,
): Promise<Role> {
  try {
    const admin = createAdminClient();
    if (!admin) return jwtRole;

    const { data, error } = await admin
      .from(TABLES_USER)
      .select("role")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data?.role) return jwtRole;
    if (data.role === Role.ADMIN || data.role === Role.USER) return data.role as Role;
    return jwtRole;
  } catch {
    return jwtRole;
  }
}
