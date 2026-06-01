"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
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
  userId: z.string().optional(),
  customerEmail: z.string().email(),
  customerName: z.string().min(2),
  customerPhone: z.string().optional(),
  shippingAddress: addressSchema,
  items: z.array(
    z.object({
      productId: z.string().optional(),
      name: z.string(),
      quantity: z.number().int().positive(),
      priceCents: z.number().int().positive(),
    }),
  ),
  shippingCents: z.number().int().nonnegative().default(0),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Stub — integrations agent wires Mercado Pago preference + webhooks */
export async function createOrderDraft(input: CheckoutInput) {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Dados inválidos" };
  }

  const { items, shippingCents, ...rest } = parsed.data;
  const itemsTotal = items.reduce(
    (s, i) => s + i.priceCents * i.quantity,
    0,
  );
  const totalCents = itemsTotal + shippingCents;

  try {
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: rest.userId,
        customerEmail: rest.customerEmail,
        customerName: rest.customerName,
        customerPhone: rest.customerPhone,
        shippingAddress: rest.shippingAddress as ShippingAddress,
        subtotalCents: itemsTotal,
        totalCents,
        shippingCents,
        status: "PENDING",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            priceCents: item.priceCents,
          })),
        },
      },
      select: { id: true },
    });

    return { ok: true as const, orderId: order.id };
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
