"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getDb, TABLES } from "@/lib/supabase/db";

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().max(20).optional().nullable(),
});

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfile(
  input: z.infer<typeof profileSchema>,
): Promise<UpdateProfileResult> {
  const user = await getSessionUser();
  if (!user?.id) return { ok: false, error: "Não autenticado" };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const db = getDb();
  const { error } = await db
    .from(TABLES.User)
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: "Não foi possível salvar o perfil" };
  return { ok: true };
}
