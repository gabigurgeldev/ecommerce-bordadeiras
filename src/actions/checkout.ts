"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import {
  resolveCheckoutLineItems,
  type CheckoutLineInput,
  type ResolvedLineItem,
} from "@/lib/checkout-items";
import { getServerCart } from "@/lib/data/cart";
import { validateCouponCode } from "@/lib/data/coupon-validate";
import { upsertPendingCheckoutOrder } from "@/lib/data/pending-order";
import { generateOrderNumber } from "@/lib/order-utils";
import {
  calculateShippingForCart,
  getShippingOptionDisplayLabel,
  type ShippingCartItem,
  type ShippingOption as QuoteShippingOption,
} from "@/lib/shipping/calculate";
import type { ShippingMethodId, ShippingOption } from "@/lib/shipping/types";
import type { ShippingAddress } from "@/lib/types/catalog";
import { entityIdSchema } from "@/lib/validations/ids";

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
  shippingAddressId: z.string().optional(),
  items: z.array(
    z.object({
      productId: entityIdSchema,
      variantId: entityIdSchema.optional(),
      quantity: z.number().int().positive(),
    }),
  ),
  shippingCents: z.number().int().nonnegative().default(0),
  shippingMethod: z.string().optional(),
  couponCode: z.string().optional().nullable(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

function toShippingCartItems(items: ResolvedLineItem[]): ShippingCartItem[] {
  return items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    priceCents: item.priceCents,
    weightGrams: item.weightGrams,
    lengthCm: item.lengthCm,
    widthCm: item.widthCm,
    heightCm: item.heightCm,
    shippingMode: item.shippingMode,
    fixedShippingCents: item.fixedShippingCents,
  }));
}

export async function validateCheckoutCoupon(
  code: string,
  subtotalCents: number,
) {
  return validateCouponCode(code, subtotalCents);
}

export async function createOrderDraft(input: CheckoutInput) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) {
    return { ok: false as const, error: "Faça login para finalizar a compra" };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Dados inválidos" };
  }

  const resolved = await resolveCheckoutLineItems(parsed.data.items);
  if (!resolved.ok) {
    return { ok: false as const, error: resolved.error };
  }

  const itemsTotal = resolved.items.reduce(
    (s, i) => s + i.priceCents * i.quantity,
    0,
  );

  let discountCents = 0;
  let couponId: string | null = null;
  if (parsed.data.couponCode) {
    const couponResult = await validateCouponCode(
      parsed.data.couponCode,
      itemsTotal,
    );
    if (!couponResult.ok) {
      return { ok: false as const, error: couponResult.error };
    }
    discountCents = couponResult.coupon.discountCents;
    couponId = couponResult.coupon.couponId;
  }

  const shippingQuote = await calculateShippingForCart(
    parsed.data.shippingAddress.cep,
    toShippingCartItems(resolved.items),
    itemsTotal,
  );

  if (!shippingQuote.ok) {
    return {
      ok: false as const,
      error: shippingQuote.fallbackMessage ?? shippingQuote.error,
    };
  }

  const options = mapQuoteOptions(shippingQuote.options);
  const selectedMethod = pickShippingMethod(options, parsed.data.shippingMethod);
  const selected =
    (selectedMethod
      ? options.find((o) => o.method === selectedMethod)
      : undefined) ?? options[0];
  const shippingCents = selected?.shippingCents ?? shippingQuote.shippingCents;
  const shippingServiceId = selected?.serviceId ?? selected?.method;
  const shippingServiceName = selected?.label;
  const { shippingCents: _clientShipping, shippingMethod: _method, ...rest } =
    parsed.data;
  const totalCents = itemsTotal - discountCents + shippingCents;

  try {
    const { order, reused } = await upsertPendingCheckoutOrder(sessionUser.id, {
      orderNumber: generateOrderNumber(),
      userId: sessionUser.id,
      customerEmail: rest.customerEmail,
      customerName: rest.customerName,
      customerPhone: rest.customerPhone,
      shippingAddress: rest.shippingAddress as ShippingAddress,
      shippingAddressId: rest.shippingAddressId ?? null,
      couponId,
      subtotalCents: itemsTotal,
      discountCents,
      totalCents,
      shippingCents,
      shippingServiceId: shippingServiceId ?? null,
      shippingServiceName: shippingServiceName ?? null,
      items: resolved.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? null,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        priceCents: item.priceCents,
      })),
    });

    return {
      ok: true as const,
      orderId: String(order.id),
      totalCents,
      shippingCents,
      reused,
    };
  } catch (e) {
    console.error("[createOrderDraft]", e);
    return {
      ok: false as const,
      error: "Não foi possível criar o pedido. Verifique o banco de dados.",
    };
  }
}

function mapQuoteOptions(options: QuoteShippingOption[]): ShippingOption[] {
  return options.map((opt) => ({
    method: opt.serviceId,
    serviceId: opt.serviceId,
    label: getShippingOptionDisplayLabel(opt),
    company: opt.company || undefined,
    companyLogoUrl: opt.companyLogoUrl,
    shippingCents: opt.priceCents,
    estimatedDays:
      opt.deliveryDays <= 1
        ? "1 dia útil"
        : `${opt.deliveryDays} dias úteis`,
  }));
}

function pickShippingMethod(
  options: ShippingOption[],
  method?: string,
): ShippingMethodId | undefined {
  if (method) {
    const found = options.find((o) => o.method === method);
    if (found) return found.method;
  }
  return options[0]?.method;
}

export async function estimateShipping(
  cep: string,
  items?: CheckoutLineInput[],
  method?: string,
) {
  let lineItems = items;

  if (!lineItems || lineItems.length === 0) {
    const user = await getSessionUser();
    if (user?.id) {
      const cart = await getServerCart(user.id);
      lineItems = cart.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
      }));
    }
  }

  if (!lineItems || lineItems.length === 0) {
    return {
      ok: false as const,
      error: "Adicione produtos ao carrinho para calcular o frete",
    };
  }

  const resolved = await resolveCheckoutLineItems(lineItems);
  if (!resolved.ok) {
    return { ok: false as const, error: resolved.error };
  }

  const subtotalCents = resolved.items.reduce(
    (s, i) => s + i.priceCents * i.quantity,
    0,
  );

  const quote = await calculateShippingForCart(
    cep,
    toShippingCartItems(resolved.items),
    subtotalCents,
  );

  if (!quote.ok) {
    return {
      ok: false as const,
      error: quote.fallbackMessage ?? quote.error,
    };
  }

  const options = mapQuoteOptions(quote.options);
  const selectedMethod = pickShippingMethod(options, method);
  const selected =
    (selectedMethod
      ? options.find((o) => o.method === selectedMethod)
      : undefined) ?? options[0];

  return {
    ok: true as const,
    shippingCents: selected?.shippingCents ?? quote.shippingCents,
    estimatedDays: selected?.estimatedDays ?? quote.estimatedDays,
    method: selectedMethod,
    options,
    freeShipping: quote.freeShippingApplied,
    freeShippingApplied: quote.freeShippingApplied,
  };
}
