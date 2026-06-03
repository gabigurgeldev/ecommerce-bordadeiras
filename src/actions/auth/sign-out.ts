"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction(redirectTo = "/") {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const safe =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
  redirect(safe);
}
