import { isDataApiAvailable } from "@/lib/supabase/db";

export const DATABASE_UNAVAILABLE_MESSAGE =
  "Banco indisponível. Confira NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.";

let cached: boolean | undefined;
let inflight: Promise<boolean> | null = null;

export async function isDatabaseAvailable(): Promise<boolean> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    const ok = await isDataApiAvailable();
    cached = ok;
    return ok;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function resetDatabaseAvailabilityCache() {
  cached = undefined;
}
