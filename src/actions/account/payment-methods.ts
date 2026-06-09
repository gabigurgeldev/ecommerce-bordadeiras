"use server";

import { getSessionUser } from "@/lib/auth/session";
import {
  createMpCustomer,
  deleteMpCard,
  getMpCustomer,
  listMpCustomerCards,
  saveMpCard,
} from "@/lib/mercadopago";
import { getDb, newId, TABLES } from "@/lib/supabase/db";

export type SavedCardView = {
  id: string;
  mpCardId: string;
  lastFourDigits: string | null;
  brand: string | null;
  expirationMonth: number | null;
  expirationYear: number | null;
  isDefault: boolean;
};

async function getOrCreateMpCustomerId(
  userId: string,
  email: string,
): Promise<string | null> {
  const db = getDb();
  const { data } = await db
    .from(TABLES.User)
    .select("mercadoPagoCustomerId")
    .eq("id", userId)
    .maybeSingle();

  if (data?.mercadoPagoCustomerId) {
    return String(data.mercadoPagoCustomerId);
  }

  try {
    const customer = await createMpCustomer(email);
    await db
      .from(TABLES.User)
      .update({
        mercadoPagoCustomerId: customer.id,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", userId);
    return customer.id;
  } catch {
    return null;
  }
}

export async function fetchSavedCards(): Promise<SavedCardView[]> {
  const user = await getSessionUser();
  if (!user?.id) return [];

  const db = getDb();
  const { data } = await db
    .from(TABLES.SavedCard)
    .select("*")
    .eq("userId", user.id)
    .order("isDefault", { ascending: false });

  return (data ?? []).map((row) => ({
    id: String(row.id),
    mpCardId: String(row.mpCardId),
    lastFourDigits: row.lastFourDigits != null ? String(row.lastFourDigits) : null,
    brand: row.brand != null ? String(row.brand) : null,
    expirationMonth:
      row.expirationMonth != null ? Number(row.expirationMonth) : null,
    expirationYear:
      row.expirationYear != null ? Number(row.expirationYear) : null,
    isDefault: Boolean(row.isDefault),
  }));
}

export async function saveCardWithToken(
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user?.id || !user.email) {
    return { ok: false, error: "Não autenticado" };
  }

  const customerId = await getOrCreateMpCustomerId(user.id, user.email);
  if (!customerId) {
    return { ok: false, error: "Mercado Pago não configurado" };
  }

  try {
    const mpCard = await saveMpCard(customerId, token);
    const db = getDb();

    const { count } = await db
      .from(TABLES.SavedCard)
      .select("*", { count: "exact", head: true })
      .eq("userId", user.id);

    const isFirst = (count ?? 0) === 0;

    const { error } = await db.from(TABLES.SavedCard).insert({
      id: newId(),
      userId: user.id,
      mpCardId: mpCard.id,
      lastFourDigits: mpCard.last_four_digits ?? null,
      brand: mpCard.payment_method?.name ?? mpCard.payment_method?.id ?? null,
      expirationMonth: mpCard.expiration_month ?? null,
      expirationYear: mpCard.expiration_year ?? null,
      isDefault: isFirst,
      createdAt: new Date().toISOString(),
    });

    if (error) return { ok: false, error: "Não foi possível salvar o cartão" };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao salvar cartão",
    };
  }
}

export async function removeSavedCard(
  cardId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user?.id) return { ok: false, error: "Não autenticado" };

  const db = getDb();
  const { data: card } = await db
    .from(TABLES.SavedCard)
    .select("mpCardId")
    .eq("id", cardId)
    .eq("userId", user.id)
    .maybeSingle();

  if (!card) return { ok: false, error: "Cartão não encontrado" };

  const { data: userRow } = await db
    .from(TABLES.User)
    .select("mercadoPagoCustomerId")
    .eq("id", user.id)
    .maybeSingle();

  const customerId = userRow?.mercadoPagoCustomerId
    ? String(userRow.mercadoPagoCustomerId)
    : null;

  if (customerId) {
    try {
      await deleteMpCard(customerId, String(card.mpCardId));
    } catch {
      /* MP card may already be removed */
    }
  }

  await db
    .from(TABLES.SavedCard)
    .delete()
    .eq("id", cardId)
    .eq("userId", user.id);

  return { ok: true };
}

export async function setDefaultSavedCard(
  cardId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user?.id) return { ok: false, error: "Não autenticado" };

  const db = getDb();
  await db
    .from(TABLES.SavedCard)
    .update({ isDefault: false })
    .eq("userId", user.id);

  const { error } = await db
    .from(TABLES.SavedCard)
    .update({ isDefault: true })
    .eq("id", cardId)
    .eq("userId", user.id);

  if (error) return { ok: false, error: "Não foi possível definir cartão padrão" };
  return { ok: true };
}

/** Sync cards from MP API to local DB (repair drift). */
export async function syncCardsFromMp(): Promise<void> {
  const user = await getSessionUser();
  if (!user?.id || !user.email) return;

  const customerId = await getOrCreateMpCustomerId(user.id, user.email);
  if (!customerId) return;

  try {
    await getMpCustomer(customerId);
    const mpCards = await listMpCustomerCards(customerId);
    const db = getDb();

    for (const mpCard of mpCards) {
      const { data: existing } = await db
        .from(TABLES.SavedCard)
        .select("id")
        .eq("userId", user.id)
        .eq("mpCardId", mpCard.id)
        .maybeSingle();

      if (!existing) {
        await db.from(TABLES.SavedCard).insert({
          id: newId(),
          userId: user.id,
          mpCardId: mpCard.id,
          lastFourDigits: mpCard.last_four_digits ?? null,
          brand: mpCard.payment_method?.name ?? null,
          expirationMonth: mpCard.expiration_month ?? null,
          expirationYear: mpCard.expiration_year ?? null,
          isDefault: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  } catch {
    /* MP unavailable */
  }
}
