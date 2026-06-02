import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { resolveCheckoutLineItems } from "@/lib/checkout-items";
import { prisma } from "@/lib/prisma";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";
import { jsonError, parseBody } from "@/lib/api-utils";
import { onNewOrder } from "@/lib/hooks/order-notifications";
import { generateOrderNumber } from "@/lib/order-utils";

const itemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
});

const schema = z.object({
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(20).optional(),
  shippingCents: z.number().int().nonnegative().default(0),
  items: z.array(itemSchema).min(1),
});

/** Create order (integration endpoint for checkout flow). */
export async function POST(request: Request) {
  const session = await auth();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }

  const parsed = parseBody(schema, body);
  if (!parsed.success) return parsed.response;

  const resolved = await resolveCheckoutLineItems(parsed.data.items);
  if (!resolved.ok) return jsonError(resolved.error, 422);

  const subtotalCents = resolved.items.reduce(
    (s, i) => s + i.priceCents * i.quantity,
    0,
  );
  const totalCents = subtotalCents + parsed.data.shippingCents;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: session?.user?.id,
      customerName: sanitizeText(parsed.data.customerName),
      customerEmail: sanitizeEmail(parsed.data.customerEmail),
      customerPhone: parsed.data.customerPhone
        ? sanitizeText(parsed.data.customerPhone)
        : null,
      subtotalCents,
      shippingCents: parsed.data.shippingCents,
      totalCents,
      items: {
        create: resolved.items.map((i) => ({
          name: sanitizeText(i.name),
          sku: i.sku,
          quantity: i.quantity,
          priceCents: i.priceCents,
          productId: i.productId,
        })),
      },
    },
    include: { items: true },
  });

  void onNewOrder(order.id);

  return NextResponse.json({ order }, { status: 201 });
}
