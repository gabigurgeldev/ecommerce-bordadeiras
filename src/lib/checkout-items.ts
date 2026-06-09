import { getDb, TABLES } from "@/lib/supabase/db";
import { ProductStatus, ShippingMode } from "@/lib/types/database";

export type CheckoutLineInput = {
  productId: string;
  variantId?: string;
  quantity: number;
};

export type ResolvedLineItem = {
  productId: string;
  variantId?: string;
  name: string;
  sku: string | null;
  quantity: number;
  priceCents: number;
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  shippingMode: ShippingMode;
  fixedShippingCents: number | null;
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
    .select(
      "id, name, sku, priceCents, stock, stockUnlimited, active, status, weightGrams, lengthCm, widthCm, heightCm, shippingMode, fixedShippingCents",
    )
    .in("id", productIds)
    .eq("active", true)
    .eq("status", ProductStatus.ACTIVE);

  if (error || !products) {
    return { ok: false, error: "Produto inválido ou indisponível" };
  }

  const variantIds = items
    .map((i) => i.variantId)
    .filter((id): id is string => Boolean(id));

  let variantMap = new Map<string, Record<string, unknown>>();
  if (variantIds.length > 0) {
    const { data: variants } = await getDb()
      .from(TABLES.ProductVariant)
      .select("id, productId, sku, priceCents, stock, stockUnlimited, active")
      .in("id", variantIds)
      .eq("active", true);
    variantMap = new Map(
      (variants ?? []).map((v) => [String(v.id), v as Record<string, unknown>]),
    );
  }

  const byId = new Map(products.map((p) => [String(p.id), p]));
  const resolved: ResolvedLineItem[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      return { ok: false, error: "Produto inválido ou indisponível" };
    }

    const variant = item.variantId ? variantMap.get(item.variantId) : null;
    if (item.variantId && !variant) {
      return { ok: false, error: "Variação indisponível" };
    }
    if (variant && String(variant.productId) !== item.productId) {
      return { ok: false, error: "Variação inválida" };
    }

    const stockUnlimited = variant
      ? Boolean(variant.stockUnlimited)
      : Boolean(product.stockUnlimited);
    const stock = variant
      ? Number(variant.stock ?? 0)
      : Number(product.stock ?? 0);

    if (!stockUnlimited && stock < item.quantity) {
      return {
        ok: false,
        error: `Estoque insuficiente para ${product.name}`,
      };
    }

    const priceCents = variant?.priceCents != null
      ? Number(variant.priceCents)
      : Number(product.priceCents);

    resolved.push({
      productId: String(product.id),
      variantId: item.variantId,
      name: String(product.name),
      sku:
        (variant?.sku != null ? String(variant.sku) : null) ??
        (product.sku != null ? String(product.sku) : null),
      quantity: item.quantity,
      priceCents,
      weightGrams:
        product.weightGrams != null ? Number(product.weightGrams) : null,
      lengthCm: product.lengthCm != null ? Number(product.lengthCm) : null,
      widthCm: product.widthCm != null ? Number(product.widthCm) : null,
      heightCm: product.heightCm != null ? Number(product.heightCm) : null,
      shippingMode: (product.shippingMode as ShippingMode) ?? ShippingMode.CORREIOS,
      fixedShippingCents:
        product.fixedShippingCents != null
          ? Number(product.fixedShippingCents)
          : null,
    });
  }

  return { ok: true, items: resolved };
}
