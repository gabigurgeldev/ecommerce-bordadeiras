import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicSupabaseEnv } from "@/lib/supabase/env-public";
import { readPublicSupabaseEnvFromProcess } from "@/lib/supabase/env-public";

let cachedClient: SupabaseClient | null = null;
let cachedEnv: PublicSupabaseEnv | null = null;

export function createClientWithEnv(env: PublicSupabaseEnv): SupabaseClient {
  return createBrowserClient(env.supabaseUrl, env.anonKey);
}

/** Sync client when NEXT_PUBLIC_* were present at build time. */
export function createClient(): SupabaseClient {
  const env = readPublicSupabaseEnvFromProcess();
  if (!env) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createClientWithEnv(env);
}

/** Resolves env at build time or via /api/config/public (runtime EasyPanel). */
export async function getBrowserSupabase(): Promise<SupabaseClient | null> {
  if (cachedClient && cachedEnv) return cachedClient;

  const fromBuild = readPublicSupabaseEnvFromProcess();
  if (fromBuild) {
    cachedEnv = fromBuild;
    cachedClient = createClientWithEnv(fromBuild);
    return cachedClient;
  }

  try {
    const res = await fetch("/api/config/public", { credentials: "same-origin" });
    if (!res.ok) return null;
    const env = (await res.json()) as PublicSupabaseEnv;
    if (!env?.supabaseUrl || !env?.anonKey) return null;
    cachedEnv = env;
    cachedClient = createClientWithEnv(env);
    return cachedClient;
  } catch {
    return null;
  }
}
