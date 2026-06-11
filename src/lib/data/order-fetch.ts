import { getDb, TABLES } from "@/lib/supabase/db";
import { formatSupabaseError } from "@/lib/supabase/error-message";

export async function fetchOrderWithItems(orderId: string) {
  const db = getDb();

  const { data: embedded, error: embedError } = await db
    .from(TABLES.Order)
    .select("*, OrderItem(*)")
    .eq("id", orderId)
    .single();

  if (!embedError && embedded) {
    return embedded;
  }

  const { data: order, error: orderError } = await db
    .from(TABLES.Order)
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(
      formatSupabaseError(orderError ?? embedError ?? "Order not found after save"),
    );
  }

  const { data: items, error: itemsError } = await db
    .from(TABLES.OrderItem)
    .select("*")
    .eq("orderId", orderId);

  if (itemsError) {
    throw new Error(formatSupabaseError(itemsError));
  }

  return { ...order, OrderItem: items ?? [] };
}
