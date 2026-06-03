"use server";

import { getSessionUser } from "@/lib/auth/session";
import { getOrderForUser, getOrdersForUser } from "@/lib/data/orders";

/** Requires Supabase session — userId never accepted from client. */
export async function fetchUserOrders() {
  const user = await getSessionUser();
  const userId = user?.id;
  if (!userId) return [];
  return getOrdersForUser(userId);
}

export async function fetchUserOrder(orderId: string) {
  const user = await getSessionUser();
  const userId = user?.id;
  if (!userId) return null;
  return getOrderForUser(userId, orderId);
}
