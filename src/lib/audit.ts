import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
    return await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId,
        userEmail: params.userEmail,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error("[audit]", error);
    return null;
  }
}
