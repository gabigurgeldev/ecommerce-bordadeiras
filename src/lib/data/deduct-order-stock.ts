import { getDb, newId, TABLES } from "@/lib/supabase/db";

function raiseSupabaseError(error: unknown, fallback: string): never {
  if (error instanceof Error) throw error;
  throw new Error(fallback);
}

/**
 * App-layer fallback for stock deduction when DB trigger is missing or already ran.
 * Idempotent via OrderItem.deductedStock.
 */
export async function deductOrderStock(orderId: string): Promise<void> {
  const db = getDb();

  const { data: items, error: itemsError } = await db
    .from(TABLES.OrderItem)
    .select("id, productId, variantId, quantity, deductedStock")
    .eq("orderId", orderId);

  if (itemsError) raiseSupabaseError(itemsError, "Order items lookup failed");
  if (!items?.length) return;

  for (const row of items) {
    if (row.deductedStock === true) continue;

    const itemId = String(row.id);
    const quantity = Number(row.quantity);
    const variantId = row.variantId != null ? String(row.variantId) : null;
    const productId = row.productId != null ? String(row.productId) : null;

    if (variantId) {
      const { data: variant, error: variantError } = await db
        .from(TABLES.ProductVariant)
        .select("id, stock, stockUnlimited, soldCount")
        .eq("id", variantId)
        .maybeSingle();
      if (variantError) raiseSupabaseError(variantError, "Product variant lookup failed");

      if (!variant || variant.stockUnlimited === true) continue;

      const currentStock = Number(variant.stock);
      const newStock = Math.max(0, currentStock - quantity);

      const variantUpdate: Record<string, unknown> = {
        stock: newStock,
        soldCount: Number(variant.soldCount ?? 0) + quantity,
        updatedAt: new Date().toISOString(),
      };
      if (newStock === 0) variantUpdate.active = false;

      const { error: variantUpdateError } = await db
        .from(TABLES.ProductVariant)
        .update(variantUpdate)
        .eq("id", variantId);
      if (variantUpdateError) {
        raiseSupabaseError(variantUpdateError, "Product variant stock update failed");
      }

      const { error: movementError } = await db.from(TABLES.StockMovement).insert({
        id: newId(),
        variantId,
        type: "sale",
        quantity: -quantity,
        previousStock: currentStock,
        newStock,
        orderId,
        notes: "App-layer deduction on payment approval",
      });
      if (movementError) raiseSupabaseError(movementError, "Stock movement insert failed");
    } else if (productId) {
      const { data: product, error: productError } = await db
        .from(TABLES.Product)
        .select("id, stock, stockUnlimited, status, active")
        .eq("id", productId)
        .maybeSingle();
      if (productError) raiseSupabaseError(productError, "Product lookup failed");

      if (!product || product.stockUnlimited === true) continue;

      const currentStock = Number(product.stock);
      const newStock = Math.max(0, currentStock - quantity);

      const { error: productUpdateError } = await db
        .from(TABLES.Product)
        .update({
          stock: newStock,
          active: newStock === 0 ? false : product.active,
          status: newStock === 0 ? "OUT_OF_STOCK" : product.status,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", productId);
      if (productUpdateError) {
        raiseSupabaseError(productUpdateError, "Product stock update failed");
      }

      const { error: movementError } = await db.from(TABLES.StockMovement).insert({
        id: newId(),
        productId,
        type: "sale",
        quantity: -quantity,
        previousStock: currentStock,
        newStock,
        orderId,
        notes: "App-layer deduction on payment approval",
      });
      if (movementError) raiseSupabaseError(movementError, "Stock movement insert failed");
    } else {
      continue;
    }

    const { error: itemUpdateError } = await db
      .from(TABLES.OrderItem)
      .update({ deductedStock: true, updatedAt: new Date().toISOString() })
      .eq("id", itemId);
    if (itemUpdateError) {
      raiseSupabaseError(itemUpdateError, "Order item stock marker update failed");
    }
  }
}
