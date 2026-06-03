import { jsonError } from "@/lib/api-utils";

/** @deprecated Use Supabase recovery flow (`resetPasswordForEmail` + `/reset-password`). */
export async function POST() {
  return jsonError(
    "Password reset via API token is disabled. Use the link sent by Supabase Auth.",
    410,
  );
}
