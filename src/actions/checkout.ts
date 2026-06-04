"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { resolveCheckoutLineItems } from "@/lib/checkout-items";
import { createOrderWithItems } from "@/lib/data/order-create";
import { generateOrderNumber } from "@/lib/order-utils";
import type { ShippingAddress } from "@/lib/types/catalog";

const addressSchema = z.object({
  cep: z.string().min(8),
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  state: z.string().length(2),
});

const checkoutSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(2),
  customerPhone: z.string().optional(),
  shippingAddress: addressSchema,
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().positive(),
    }),
  ),
  shippingCents: z.number().int().nonnegative().default(0),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export async function createOrderDraft(input: CheckoutInput) {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Dados inválidos" };
  }

  const resolved = await resolveCheckoutLineItems(parsed.data.items);
  if (!resolved.ok) {
    return { ok: false as const, error: resolved.error };
  }

  const sessionUser = await getSessionUser();
  const { shippingCents, ...rest } = parsed.data;
  const itemsTotal = resolved.items.reduce(
    (s, i) => s + i.priceCents * i.quantity,
    0,
  );
  const totalCents = itemsTotal + shippingCents;

  try {
    const order = await createOrderWithItems({
      orderNumber: generateOrderNumber(),
      userId: sessionUser?.id,
      customerEmail: rest.customerEmail,
      customerName: rest.customerName,
      customerPhone: rest.customerPhone,
      shippingAddress: rest.shippingAddress as ShippingAddress,
      subtotalCents: itemsTotal,
      totalCents,
      shippingCents,
      items: resolved.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        priceCents: item.priceCents,
      })),
    });

    return { ok: true as const, orderId: String(order.id) };
  } catch (e) {
    console.error("[createOrderDraft]", e);
    return {
      ok: false as const,
      error: "Não foi possível criar o pedido. Verifique o banco de dados.",
    };
  }
}

export async function estimateShipping(_cep: string) {
  return {
    ok: true as const,
    shippingCents: 4900,
    estimatedDays: "5–10 dias úteis",
  };
}
