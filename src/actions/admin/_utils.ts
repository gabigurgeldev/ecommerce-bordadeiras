"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog } from "@/lib/audit";
import type { AuditAction } from "@/lib/types/database";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function withAdmin<T>(
  fn: (actor: Awaited<ReturnType<typeof requireAdmin>>) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    const actor = await requireAdmin();
    return await fn(actor);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}

export async function withAdminRead<T>(fn: () => Promise<T>): Promise<T> {
  await requireAdmin();
  return fn();
}

export async function auditMutation(
  actor: { id: string; email: string },
  params: {
    action: AuditAction;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await createAuditLog({
    ...params,
    userId: actor.id,
    userEmail: actor.email,
  });
}

export async function revalidateAdmin(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}
