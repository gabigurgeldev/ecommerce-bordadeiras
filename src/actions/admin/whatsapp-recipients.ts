"use server";

import { prisma } from "@/lib/prisma";
import { whatsappRecipientSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listWhatsappRecipients() {
  return withAdminRead(() =>
    prisma.whatsappRecipient.findMany({
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function createWhatsappRecipient(data: unknown): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = whatsappRecipientSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    const recipient = await prisma.whatsappRecipient.create({
      data: {
        label: parsed.data.label,
        phone: parsed.data.phone,
        active: parsed.data.active ?? true,
      },
    });

    await auditMutation(actor, {
      action: "CREATE",
      entity: "WhatsappRecipient",
      entityId: recipient.id,
    });
    revalidateAdmin(["/admin/whatsapp"]);
    return { success: true };
  });
}

export async function updateWhatsappRecipient(
  id: string,
  data: unknown
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = whatsappRecipientSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    await prisma.whatsappRecipient.update({
      where: { id },
      data: {
        label: parsed.data.label,
        phone: parsed.data.phone,
        active: parsed.data.active ?? true,
      },
    });

    await auditMutation(actor, {
      action: "UPDATE",
      entity: "WhatsappRecipient",
      entityId: id,
    });
    revalidateAdmin(["/admin/whatsapp"]);
    return { success: true };
  });
}

export async function deleteWhatsappRecipient(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    await prisma.whatsappRecipient.delete({ where: { id } });

    await auditMutation(actor, {
      action: "DELETE",
      entity: "WhatsappRecipient",
      entityId: id,
    });
    revalidateAdmin(["/admin/whatsapp"]);
    return { success: true };
  });
}

export async function toggleWhatsappRecipient(
  id: string,
  active: boolean
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    await prisma.whatsappRecipient.update({
      where: { id },
      data: { active },
    });

    await auditMutation(actor, {
      action: "UPDATE",
      entity: "WhatsappRecipient",
      entityId: id,
      metadata: { active },
    });
    revalidateAdmin(["/admin/whatsapp"]);
    return { success: true };
  });
}
