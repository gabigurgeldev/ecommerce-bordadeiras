"use server";

import { getOrderForUser, getOrdersForUser } from "@/lib/data/orders";

/** Requires session from NextAuth — auth agent */
export async function fetchUserOrders(userId: string) {
  return getOrdersForUser(userId);
}

export async function fetchUserOrder(userId: string, orderId: string) {
  return getOrderForUser(userId, orderId);
}
