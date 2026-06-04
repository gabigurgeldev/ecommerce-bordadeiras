import { getDb, TABLES } from "@/lib/supabase/db";
import { ProductStatus } from "@/lib/types/database";

export type CheckoutLineInput = {
  productId: string;
  quantity: number;
};

export type ResolvedLineItem = {
  productId: string;
  name: string;
  sku: string | null;
  quantity: number;
  priceCents: number;
};

export async function resolveCheckoutLineItems(
  items: CheckoutLineInput[],
): Promise<
  { ok: true; items: ResolvedLineItem[] } | { ok: false; error: string }
> {
  if (items.length === 0) {
    return { ok: false, error: "Nenhum item no pedido" };
  }

  const productIds = [...new Set(items.map((i) => i.productId))];
  const { data: products, error } = await getDb()
    .from(TABLES.Product)
    .select("id, name, sku, priceCents, stock")
    .in("id", productIds)
    .eq("active", true)
    .eq("status", ProductStatus.ACTIVE);

  if (error || !products) {
    return { ok: false, error: "Produto inválido ou indisponível" };
  }

  const byId = new Map(products.map((p) => [String(p.id), p]));
  const resolved: ResolvedLineItem[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      return { ok: false, error: "Produto inválido ou indisponível" };
    }
    if (Number(product.stock) < item.quantity) {
      return {
        ok: false,
        error: `Estoque insuficiente para ${product.name}`,
      };
    }

    resolved.push({
      productId: String(product.id),
      name: String(product.name),
      sku: product.sku != null ? String(product.sku) : null,
      quantity: item.quantity,
      priceCents: Number(product.priceCents),
    });
  }

  return { ok: true, items: resolved };
}
