"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getDb, newId, TABLES } from "@/lib/supabase/db";
import type { Address } from "@/lib/types/database";

const addressSchema = z.object({
  label: z.string().max(50).optional().nullable(),
  recipientName: z.string().min(2),
  phone: z.string().max(20).optional().nullable(),
  zipCode: z.string().min(8),
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  state: z.string().length(2),
  country: z.string().default("BR"),
  isDefault: z.boolean().optional(),
});

export async function fetchUserAddresses(): Promise<Address[]> {
  const user = await getSessionUser();
  if (!user?.id) return [];

  const db = getDb();
  const { data } = await db
    .from(TABLES.Address)
    .select("*")
    .eq("userId", user.id)
    .order("isDefault", { ascending: false });

  return (data ?? []) as Address[];
}

export async function createAddress(
  input: z.infer<typeof addressSchema>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user?.id) return { ok: false, error: "Não autenticado" };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const db = getDb();
  const id = newId();

  if (parsed.data.isDefault) {
    await db
      .from(TABLES.Address)
      .update({ isDefault: false })
      .eq("userId", user.id);
  }

  const { error } = await db.from(TABLES.Address).insert({
    id,
    userId: user.id,
    ...parsed.data,
    isDefault: parsed.data.isDefault ?? false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (error) return { ok: false, error: "Não foi possível salvar o endereço" };
  return { ok: true, id };
}

export async function deleteAddress(
  addressId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user?.id) return { ok: false, error: "Não autenticado" };

  const db = getDb();
  const { error } = await db
    .from(TABLES.Address)
    .delete()
    .eq("id", addressId)
    .eq("userId", user.id);

  if (error) return { ok: false, error: "Não foi possível remover o endereço" };
  return { ok: true };
}

export async function setDefaultAddress(
  addressId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user?.id) return { ok: false, error: "Não autenticado" };

  const db = getDb();
  await db
    .from(TABLES.Address)
    .update({ isDefault: false })
    .eq("userId", user.id);

  const { error } = await db
    .from(TABLES.Address)
    .update({ isDefault: true, updatedAt: new Date().toISOString() })
    .eq("id", addressId)
    .eq("userId", user.id);

  if (error) return { ok: false, error: "Não foi possível definir endereço padrão" };
  return { ok: true };
}
