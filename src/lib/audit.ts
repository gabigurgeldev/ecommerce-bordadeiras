import { getDb, newId, TABLES } from "@/lib/supabase/db";
import type { AuditAction } from "@/lib/types/database";

export type AuditParams = {
  action: AuditAction;
  entity: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
};

export async function createAuditLog(params: AuditParams) {
  try {
    const { data, error } = await getDb()
      .from(TABLES.AuditLog)
      .insert({
        id: newId(),
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        userId: params.userId ?? null,
        userEmail: params.userEmail ?? null,
        metadata: params.metadata ?? null,
        ipAddress: params.ipAddress ?? null,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[audit]", error);
    return null;
  }
}
