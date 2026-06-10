"use server";

import { getSessionUser } from "@/lib/auth/session";
import {
  clearServerCartForUser,
  getServerCart,
  syncServerCart,
} from "@/lib/data/cart";
import { mergeCartLines } from "@/lib/data/cart-merge";
import type { CartLine } from "@/store/cart";

export async function fetchServerCart(): Promise<CartLine[]> {
  const user = await getSessionUser();
  if (!user?.id) return [];
  return getServerCart(user.id);
}

export async function syncCart(lines: CartLine[]): Promise<CartLine[]> {
  const user = await getSessionUser();
  if (!user?.id) return lines;
  return syncServerCart(user.id, lines);
}

export async function mergeGuestCart(
  guestLines: CartLine[],
): Promise<CartLine[]> {
  const user = await getSessionUser();
  if (!user?.id) return guestLines;

  const serverLines = await getServerCart(user.id);
  const merged = mergeCartLines(guestLines, serverLines);
  return syncServerCart(user.id, merged);
}

export async function clearServerCart(): Promise<void> {
  const user = await getSessionUser();
  if (!user?.id) return;
  await clearServerCartForUser(user.id);
}
