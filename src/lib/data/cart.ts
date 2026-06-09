import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { cartLineKey } from "@/lib/data/cart-merge";
import type { CartLine } from "@/store/cart";

export type ServerCartRow = {
  id: string;
  userId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  slug: string | null;
  name: string | null;
  priceCents: number | null;
  imageUrl: string | null;
};

function rowToLine(row: ServerCartRow): CartLine {
  return {
    lineId: cartLineKey(row.productId, row.variantId ?? undefined),
    productId: row.productId,
    variantId: row.variantId ?? undefined,
    slug: row.slug ?? "",
    name: row.name ?? "Produto",
    priceCents: row.priceCents ?? 0,
    imageUrl: row.imageUrl ?? "",
    quantity: row.quantity,
  };
}

export async function getServerCart(userId: string): Promise<CartLine[]> {
  try {
    const db = getDb();
    const { data, error } = await db
      .from(TABLES.CartItem)
      .select("*")
      .eq("userId", userId);
    if (error || !data) return [];
    return (data as ServerCartRow[]).map(rowToLine);
  } catch {
    return [];
  }
}

export async function syncServerCart(
  userId: string,
  lines: CartLine[],
): Promise<CartLine[]> {
  const db = getDb();
  const revalidated = await revalidateCartLines(lines);

  const { data: existing } = await db
    .from(TABLES.CartItem)
    .select("id, productId, variantId")
    .eq("userId", userId);

  const existingRows = (existing ?? []) as {
    id: string;
    productId: string;
    variantId: string | null;
  }[];

  const desiredKeys = new Set(
    revalidated.map((l) => `${l.productId}:${l.variantId ?? ""}`),
  );

  const toDelete = existingRows.filter(
    (r) => !desiredKeys.has(`${r.productId}:${r.variantId ?? ""}`),
  );

  if (toDelete.length > 0) {
    await db
      .from(TABLES.CartItem)
      .delete()
      .in(
        "id",
        toDelete.map((r) => r.id),
      );
  }

  for (const line of revalidated) {
    const match = existingRows.find(
      (r) =>
        r.productId === line.productId &&
        (r.variantId ?? "") === (line.variantId ?? ""),
    );

    const payload = {
      userId,
      productId: line.productId,
      variantId: line.variantId ?? null,
      quantity: line.quantity,
      slug: line.slug,
      name: line.name,
      priceCents: line.priceCents,
      imageUrl: line.imageUrl,
      updatedAt: new Date().toISOString(),
    };

    if (match) {
      await db.from(TABLES.CartItem).update(payload).eq("id", match.id);
    } else {
      await db.from(TABLES.CartItem).insert({ id: newId(), ...payload });
    }
  }

  return revalidated;
}

export async function revalidateCartLines(lines: CartLine[]): Promise<CartLine[]> {
  if (lines.length === 0) return [];

  const db = getDb();
  const productIds = [...new Set(lines.map((l) => l.productId))];

  const { data: products } = await db
    .from(TABLES.Product)
    .select("id, name, slug, priceCents, stock, stockUnlimited, active, status, images")
    .in("id", productIds)
    .eq("active", true)
    .eq("status", "ACTIVE");

  const productMap = new Map(
    (products ?? []).map((p) => [String(p.id), p as Record<string, unknown>]),
  );

  const variantIds = lines
    .map((l) => l.variantId)
    .filter((id): id is string => Boolean(id));

  let variantMap = new Map<string, Record<string, unknown>>();
  if (variantIds.length > 0) {
    const { data: variants } = await db
      .from(TABLES.ProductVariant)
      .select("id, productId, priceCents, stock, stockUnlimited, active, imageUrl")
      .in("id", variantIds)
      .eq("active", true);
    variantMap = new Map(
      (variants ?? []).map((v) => [String(v.id), v as Record<string, unknown>]),
    );
  }

  const result: CartLine[] = [];

  for (const line of lines) {
    const product = productMap.get(line.productId);
    if (!product) continue;

    const variant = line.variantId ? variantMap.get(line.variantId) : null;
    if (line.variantId && !variant) continue;

    const stockUnlimited = variant
      ? Boolean(variant.stockUnlimited)
      : Boolean(product.stockUnlimited);
    const stock = variant
      ? Number(variant.stock ?? 0)
      : Number(product.stock ?? 0);

    if (!stockUnlimited && stock <= 0) continue;

    const priceCents = variant?.priceCents != null
      ? Number(variant.priceCents)
      : Number(product.priceCents);

    const images = Array.isArray(product.images) ? product.images : [];
    const imageUrl =
      (variant?.imageUrl as string | undefined) ||
      (typeof images[0] === "string"
        ? images[0]
        : typeof images[0] === "object" &&
            images[0] !== null &&
            "url" in (images[0] as object)
          ? String((images[0] as { url: string }).url)
          : line.imageUrl);

    const qty = stockUnlimited
      ? line.quantity
      : Math.min(line.quantity, stock);

    if (qty < 1) continue;

    result.push({
      ...line,
      name: String(product.name),
      slug: String(product.slug),
      priceCents,
      imageUrl,
      quantity: qty,
    });
  }

  return result;
}
