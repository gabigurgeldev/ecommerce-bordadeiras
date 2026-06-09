import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseBody } from "@/lib/api-utils";
import { getDb, TABLES } from "@/lib/supabase/db";
import { calculateShippingForProduct } from "@/lib/shipping/calculate";
import { toDisplayShippingOptions } from "@/lib/shipping/display-options";
import { isValidCep } from "@/lib/shipping/cep";
import { ProductStatus, ShippingMode } from "@/lib/types/database";
import { entityIdSchema } from "@/lib/validations/ids";

export const maxDuration = 20;

const quoteSchema = z.object({
  cep: z.string().min(8),
  productId: entityIdSchema,
  quantity: z.coerce.number().int().positive().max(99).default(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseBody(quoteSchema, body);
    if (!parsed.success) return parsed.response;

    const { cep, productId, quantity } = parsed.data;

    if (!isValidCep(cep)) {
      return jsonError("CEP inválido (8 dígitos)", 422);
    }

    const { data: product, error } = await getDb()
      .from(TABLES.Product)
      .select(
        "id, priceCents, weightGrams, lengthCm, widthCm, heightCm, shippingMode, fixedShippingCents, active, status",
      )
      .eq("id", productId)
      .eq("active", true)
      .eq("status", ProductStatus.ACTIVE)
      .maybeSingle();

    if (error || !product) {
      return jsonError("Produto não encontrado", 404);
    }

    const quote = await calculateShippingForProduct(cep, {
      productId: String(product.id),
      quantity,
      priceCents: Number(product.priceCents),
      weightGrams:
        product.weightGrams != null ? Number(product.weightGrams) : null,
      lengthCm: product.lengthCm != null ? Number(product.lengthCm) : null,
      widthCm: product.widthCm != null ? Number(product.widthCm) : null,
      heightCm: product.heightCm != null ? Number(product.heightCm) : null,
      shippingMode:
        (product.shippingMode as ShippingMode) ?? ShippingMode.CORREIOS,
      fixedShippingCents:
        product.fixedShippingCents != null
          ? Number(product.fixedShippingCents)
          : null,
    });

    if (!quote.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: quote.error,
          message: quote.fallbackMessage ?? quote.error,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      ok: true,
      shippingCents: quote.shippingCents,
      estimatedDays: quote.estimatedDays,
      freeShippingApplied: quote.freeShippingApplied,
      options: toDisplayShippingOptions(quote),
    });
  } catch (err) {
    console.error("[api/shipping/quote]", err);
    return jsonError("Erro interno ao calcular frete", 500);
  }
}
