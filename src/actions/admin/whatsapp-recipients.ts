"use server";

import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { whatsappRecipientSchema } from "@/lib/validations/admin";
import { normalizeBrazilPhone } from "@/lib/whatsapp-utils";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

function normalizeRecipientPhone(raw: string): string | null {
  return normalizeBrazilPhone(raw);
}

export async function listWhatsappRecipients() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.WhatsappRecipient)
      .select("*")
      .order("createdAt", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export async function createWhatsappRecipient(data: unknown): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = whatsappRecipientSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    const phone = normalizeRecipientPhone(parsed.data.phone);
    if (!phone) {
      return {
        success: false,
        error: "Telefone inválido. Use DDD + número (ex.: 11999999999 ou 5511999999999)",
      };
    }

    const id = newId();
    const now = new Date().toISOString();
    const { error } = await getDb().from(TABLES.WhatsappRecipient).insert({
      id,
      label: parsed.data.label,
      phone,
      active: parsed.data.active ?? true,
      createdAt: now,
      updatedAt: now,
    });
    if (error) return { success: false, error: error.message };

    await auditMutation(actor, {
      action: "CREATE",
      entity: "WhatsappRecipient",
      entityId: id,
    });
    revalidateAdmin(["/admin/whatsapp"]);
    return { success: true };
  });
}

export async function updateWhatsappRecipient(
  id: string,
  data: unknown,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = whatsappRecipientSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    const phone = normalizeRecipientPhone(parsed.data.phone);
    if (!phone) {
      return {
        success: false,
        error: "Telefone inválido. Use DDD + número (ex.: 11999999999 ou 5511999999999)",
      };
    }

    const { error } = await getDb()
      .from(TABLES.WhatsappRecipient)
      .update({
        label: parsed.data.label,
        phone,
        active: parsed.data.active ?? true,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { success: false, error: error.message };

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
    const { error } = await getDb().from(TABLES.WhatsappRecipient).delete().eq("id", id);
    if (error) return { success: false, error: error.message };

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
  active: boolean,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const { error } = await getDb()
      .from(TABLES.WhatsappRecipient)
      .update({ active, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) return { success: false, error: error.message };

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
