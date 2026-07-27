"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { ActionError } from "./_helpers";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

/** redirect()/notFound() signal control flow by throwing; never swallow them. */
function isNextControlFlowError(e: unknown): boolean {
  const digest = (e as { digest?: unknown })?.digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")
  );
}

export async function withAdmin<T>(
  fn: (actor: Awaited<ReturnType<typeof requireAdmin>>) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    const actor = await requireAdmin();
    return await fn(actor);
  } catch (e) {
    if (isNextControlFlowError(e)) throw e;
    if (e instanceof ActionError) return { success: false, error: e.message };
    console.error("[admin action]", e);
    return { success: false, error: "Não foi possível concluir a operação" };
  }
}

export async function withAdminRead<T>(fn: () => Promise<T>): Promise<T> {
  await requireAdmin();
  return fn();
}
