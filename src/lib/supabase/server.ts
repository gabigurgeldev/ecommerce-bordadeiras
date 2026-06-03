import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readPublicSupabaseEnvFromProcess } from "@/lib/supabase/env-public";

export async function createClient() {
  const cookieStore = await cookies();

  const env = readPublicSupabaseEnvFromProcess();
  if (!env) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  const { supabaseUrl: url, anonKey } = env;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll from Server Component — middleware refreshes session
        }
      },
    },
  });
}
