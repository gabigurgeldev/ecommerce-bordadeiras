import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      active: true,
      status: ProductStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      priceCents: true,
      stock: true,
    },
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const resolved: ResolvedLineItem[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      return { ok: false, error: "Produto inválido ou indisponível" };
    }
    if (product.stock < item.quantity) {
      return {
        ok: false,
        error: `Estoque insuficiente para ${product.name}`,
      };
    }

    resolved.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: item.quantity,
      priceCents: product.priceCents,
    });
  }

  return { ok: true, items: resolved };
}
