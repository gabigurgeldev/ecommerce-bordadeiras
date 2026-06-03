import type { SupabaseClient } from "@supabase/supabase-js";

export async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string,
) {
  let page = 1;
  const normalized = email.trim().toLowerCase();

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error("[auth] listUsers", error);
      return null;
    }
    const match = data.users.find(
      (u) => u.email?.trim().toLowerCase() === normalized,
    );
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }

  return null;
}
