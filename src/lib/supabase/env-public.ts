/** Public Supabase env (safe to expose to the browser — anon key only). */
export type PublicSupabaseEnv = {
  supabaseUrl: string;
  anonKey: string;
};

export function readPublicSupabaseEnvFromProcess():
  | PublicSupabaseEnv
  | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !anonKey) return null;
  return { supabaseUrl, anonKey };
}
