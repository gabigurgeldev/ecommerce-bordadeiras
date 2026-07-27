import { revalidatePath, revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import type { AuditAction } from "@/lib/types/database";

/**
 * Plain module — deliberately NOT "use server".
 *
 * Every async export of a "use server" file becomes a callable endpoint. These
 * two helpers take fully serializable arguments and perform no authorization of
 * their own, so exposing them let anyone forge audit-log entries and invalidate
 * arbitrary cache paths. They are only ever used from inside withAdmin().
 */

/** Error whose message is safe to show to the admin. Anything else is generic. */
export class ActionError extends Error {}

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

export function revalidateAdmin(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

/** Drops the storefront's cached catalog reads after an admin mutation. */
export function revalidateCatalog(...tags: string[]) {
  for (const tag of tags) revalidateTag(tag);
}
