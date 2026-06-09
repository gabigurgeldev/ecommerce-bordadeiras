import type { CartLine } from "@/store/cart";

export function cartLineKey(productId: string, variantId?: string) {
  return variantId ? `line-${productId}-${variantId}` : `line-${productId}`;
}

/** Stable signature for cart sync — ignores display-only fields (name, image, price). */
export function cartLinesSignature(lines: CartLine[]): string {
  return JSON.stringify(
    [...lines]
      .sort((a, b) => a.lineId.localeCompare(b.lineId))
      .map((l) => ({
        lineId: l.lineId,
        productId: l.productId,
        variantId: l.variantId ?? null,
        quantity: l.quantity,
      })),
  );
}

export function cartLinesEqual(a: CartLine[], b: CartLine[]): boolean {
  return cartLinesSignature(a) === cartLinesSignature(b);
}

/** Merge guest and server carts — keeps higher quantity per line. */
export function mergeCartLines(
  guestLines: CartLine[],
  serverLines: CartLine[],
): CartLine[] {
  const map = new Map<string, CartLine>();

  for (const line of serverLines) {
    map.set(line.lineId, { ...line });
  }

  for (const guest of guestLines) {
    const existing = map.get(guest.lineId);
    if (!existing) {
      map.set(guest.lineId, { ...guest });
      continue;
    }
    map.set(guest.lineId, {
      ...existing,
      quantity: Math.max(existing.quantity, guest.quantity),
      name: existing.name || guest.name,
      slug: existing.slug || guest.slug,
      imageUrl: existing.imageUrl || guest.imageUrl,
      priceCents: existing.priceCents || guest.priceCents,
    });
  }

  return Array.from(map.values());
}
