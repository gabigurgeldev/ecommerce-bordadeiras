import { NextResponse } from "next/server";
import { readPublicSupabaseEnvFromProcess } from "@/lib/supabase/env-public";

/** Runtime public config (EasyPanel env without rebuild). */
export async function GET() {
  const env = readPublicSupabaseEnvFromProcess();
  if (!env) {
    return NextResponse.json(
      {
        error: "missing_config",
        message:
          "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no EasyPanel e redeploy.",
      },
      { status: 503 },
    );
  }
  return NextResponse.json(env, {
    headers: { "Cache-Control": "no-store" },
  });
}
