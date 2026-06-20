"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getDb, TABLES } from "@/lib/supabase/db";
import {
  DEFAULT_NOTIFICATION_PREFS,
  normalizeNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/privacy/consent";

export type { NotificationPrefs } from "@/lib/privacy/consent";

const prefsSchema = z.object({
  orderUpdates: z.boolean(),
  promotions: z.boolean(),
  email: z.boolean(),
  whatsapp: z.boolean(),
  behavioralAnalytics: z.boolean(),
  aiPersonalization: z.boolean(),
  consentUpdatedAt: z.string().nullable().optional(),
});

export async function fetchNotificationPrefs(): Promise<NotificationPrefs> {
  const user = await getSessionUser();
  if (!user?.id) return DEFAULT_NOTIFICATION_PREFS;

  const db = getDb();
  const { data } = await db
    .from(TABLES.User)
    .select("notificationPrefs")
    .eq("id", user.id)
    .maybeSingle();

  const prefs = data?.notificationPrefs;
  return normalizeNotificationPrefs(prefs);
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
      notificationPrefs: {
        ...parsed.data,
        consentUpdatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: "Não foi possível salvar preferências" };
  return { ok: true };
}
