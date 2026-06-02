"use server";

import { auth } from "@/auth";
import { getOrderForUser, getOrdersForUser } from "@/lib/data/orders";

/** Requires session from NextAuth — userId never accepted from client. */
export async function fetchUserOrders() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];
  return getOrdersForUser(userId);
}

export async function fetchUserOrder(orderId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return getOrderForUser(userId, orderId);
}
