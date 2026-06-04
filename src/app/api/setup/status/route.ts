import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { readAdminEnv } from "@/lib/admin-bootstrap";
import { jsonError } from "@/lib/api-utils";
import { isSupabaseAuthConfigured } from "@/lib/auth/env";
import { findUserByEmail } from "@/lib/supabase/db";

/** Diagnóstico rápido de deploy (sem expor senhas). */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    if (!(await requireAdminApi())) {
      return jsonError("Not found", 404);
    }
  }

  const adminEnv = readAdminEnv();
  let adminInDb = false;

  try {
    const user = await findUserByEmail(adminEnv.email);
    adminInDb = Boolean(user?.passwordHash);
  } catch {
    adminInDb = false;
  }

  return NextResponse.json({
    supabaseAuthConfigured: isSupabaseAuthConfigured(),
    supabaseUrlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    supabaseAnonKeySet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    supabaseServiceRoleKeySet: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    adminEmailConfigured: adminEnv.email,
    adminInDatabase: adminInDb,
    runDbSeed: process.env.RUN_DB_SEED ?? "true",
  });
}
