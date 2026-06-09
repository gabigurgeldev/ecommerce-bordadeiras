"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getDb, TABLES } from "@/lib/supabase/db";

export type NotificationPrefs = {
  orderUpdates: boolean;
  promotions: boolean;
  email: boolean;
};

const prefsSchema = z.object({
  orderUpdates: z.boolean(),
  promotions: z.boolean(),
  email: z.boolean(),
});

const DEFAULT_PREFS: NotificationPrefs = {
  orderUpdates: true,
  promotions: false,
  email: true,
};

export async function fetchNotificationPrefs(): Promise<NotificationPrefs> {
  const user = await getSessionUser();
  if (!user?.id) return DEFAULT_PREFS;

  const db = getDb();
  const { data } = await db
    .from(TABLES.User)
    .select("notificationPrefs")
    .eq("id", user.id)
    .maybeSingle();

  const prefs = data?.notificationPrefs;
  if (prefs && typeof prefs === "object") {
    return { ...DEFAULT_PREFS, ...(prefs as NotificationPrefs) };
  }
  return DEFAULT_PREFS;
}

export async function updateNotificationPrefs(
  input: NotificationPrefs,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user?.id) return { ok: false, error: "Não autenticado" };

  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const db = getDb();
  const { error } = await db
    .from(TABLES.User)
    .update({
      notificationPrefs: parsed.data,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: "Não foi possível salvar preferências" };
  return { ok: true };
}
