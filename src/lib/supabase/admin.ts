import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/** Service-role client — server only (never expose to the browser). */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set for admin operations",
    );
  }
  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

/** Returns null when service role is not configured (optional legacy migration). */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  return getSupabaseAdmin();
}
