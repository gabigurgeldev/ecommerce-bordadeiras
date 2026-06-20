-- Public catalog hardening follow-up.
-- Keep server/service_role access unchanged; browser roles get allowlisted columns
-- and public views instead of direct access to sensitive table fields.

-- ─── Public read surface: column grants + allowlisted views ──────────────────

REVOKE SELECT ON TABLE "Product" FROM anon, authenticated;
REVOKE SELECT ON TABLE "ProductVariant" FROM anon, authenticated;
REVOKE SELECT ON TABLE "ProductReview" FROM anon, authenticated;
REVOKE SELECT ("costCents") ON TABLE "Product" FROM anon, authenticated;
REVOKE SELECT ("costCents", "attributes", "soldCount", "lowStockThreshold") ON TABLE "ProductVariant" FROM anon, authenticated;
REVOKE SELECT ("userId") ON TABLE "ProductReview" FROM anon, authenticated;

GRANT SELECT (
  "id",
  "name",
  "slug",
  "description",
  "sku",
  "priceCents",
  "compareCents",
  "stock",
  "status",
  "active",
  "images",
  "categoryId",
  "createdAt",
  "updatedAt",
  "seoTitle",
  "seoDescription",
  "tags",
  "brand",
  "showPrice",
  "stockUnlimited",
  "weightGrams",
  "lengthCm",
  "widthCm",
  "heightCm",
  "videoUrl",
  "videoUrls",
  "shippingMode",
  "fixedShippingCents"
) ON TABLE "Product" TO anon, authenticated;

GRANT SELECT (
  "id",
  "productId",
  "sku",
  "priceCents",
  "compareCents",
  "stock",
  "stockUnlimited",
  "imageUrl",
  "sortOrder",
  "active"
) ON TABLE "ProductVariant" TO anon, authenticated;

GRANT SELECT (
  "id",
  "productId",
  "authorName",
  "text",
  "rating",
  "imageUrl",
  "source",
  "createdAt",
  "updatedAt"
) ON TABLE "ProductReview" TO anon, authenticated;

CREATE OR REPLACE VIEW "PublicProduct"
WITH (security_barrier = true)
AS
SELECT
  p."id",
  p."name",
  p."slug",
  p."description",
  p."sku",
  p."priceCents",
  p."compareCents",
  p."stock",
  p."status",
  p."active",
  p."images",
  p."categoryId",
  p."createdAt",
  p."updatedAt",
  p."seoTitle",
  p."seoDescription",
  p."tags",
  p."brand",
  p."showPrice",
  p."stockUnlimited",
  p."weightGrams",
  p."lengthCm",
  p."widthCm",
  p."heightCm",
  p."videoUrl",
  p."videoUrls",
  p."shippingMode",
  p."fixedShippingCents"
FROM "Product" p
WHERE p.active = true
  AND p.status = 'ACTIVE'::"ProductStatus";

CREATE OR REPLACE VIEW "PublicProductVariant"
WITH (security_barrier = true)
AS
SELECT
  v."id",
  v."productId",
  v."sku",
  v."priceCents",
  v."compareCents",
  v."stock",
  v."stockUnlimited",
  v."imageUrl",
  v."sortOrder",
  v."active"
FROM "ProductVariant" v
JOIN "Product" p ON p.id = v."productId"
WHERE v.active = true
  AND p.active = true
  AND p.status = 'ACTIVE'::"ProductStatus";

CREATE OR REPLACE VIEW "PublicProductReview"
WITH (security_barrier = true)
AS
SELECT
  r."id",
  r."productId",
  r."authorName",
  r."text",
  r."rating",
  r."imageUrl",
  r."source",
  r."createdAt",
  r."updatedAt"
FROM "ProductReview" r
JOIN "Product" p ON p.id = r."productId"
WHERE p.active = true
  AND p.status = 'ACTIVE'::"ProductStatus";

GRANT SELECT ON TABLE "PublicProduct" TO anon, authenticated;
GRANT SELECT ON TABLE "PublicProductVariant" TO anon, authenticated;
GRANT SELECT ON TABLE "PublicProductReview" TO anon, authenticated;

COMMENT ON VIEW "PublicProduct" IS
  'Public storefront product projection. Excludes internal cost fields; prefer this view for browser/PostgREST reads.';
COMMENT ON VIEW "PublicProductVariant" IS
  'Public storefront variant projection. Excludes costCents, attributes, soldCount and lowStockThreshold.';
COMMENT ON VIEW "PublicProductReview" IS
  'Public storefront review projection. Excludes userId to avoid exposing account linkage.';

COMMENT ON COLUMN "Product"."costCents" IS
  'Internal margin/accounting field. Browser roles must not read it directly; use PublicProduct for storefront reads.';
COMMENT ON COLUMN "ProductVariant"."costCents" IS
  'Internal margin/accounting field. Browser roles must not read it directly; use PublicProductVariant for storefront reads.';
COMMENT ON COLUMN "ProductVariant"."attributes" IS
  'Internal variant metadata. Do not expose directly to anon/authenticated clients unless explicitly sanitized.';
COMMENT ON COLUMN "ProductVariant"."soldCount" IS
  'Internal sales metric. Do not expose directly to anon/authenticated clients.';
COMMENT ON COLUMN "ProductReview"."userId" IS
  'Internal account linkage for review ownership/deduplication. Public reads must use PublicProductReview.';

-- ─── Additional defensive constraints ────────────────────────────────────────
-- NOT VALID avoids scanning/rejecting existing historical rows during deploy;
-- PostgreSQL still checks new and updated rows immediately.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('Product', 'Product_compareCents_gte_priceCents_check', '"compareCents" IS NULL OR "compareCents" >= "priceCents"'),
      ('Product', 'Product_fixed_shipping_requires_amount_check', '"shippingMode" IS DISTINCT FROM ''FIXED''::"ShippingMode" OR "fixedShippingCents" IS NOT NULL'),
      ('ProductVariant', 'ProductVariant_compareCents_gte_priceCents_check', '"compareCents" IS NULL OR "priceCents" IS NULL OR "compareCents" >= "priceCents"'),
      ('Coupon', 'Coupon_percent_value_range_check', 'type <> ''PERCENT''::"CouponType" OR (value > 0 AND value <= 100)'),
      ('Coupon', 'Coupon_fixed_value_positive_check', 'type <> ''FIXED''::"CouponType" OR value > 0'),
      ('Coupon', 'Coupon_valid_window_check', '"validFrom" IS NULL OR "validUntil" IS NULL OR "validUntil" > "validFrom"'),
      ('Coupon', 'Coupon_usedCount_lte_maxUses_check', '"maxUses" IS NULL OR "usedCount" <= "maxUses"'),
      ('Order', 'Order_discount_lte_subtotal_check', '"discountCents" <= "subtotalCents"'),
      ('Order', 'Order_total_arithmetic_check', '"totalCents" = "subtotalCents" - "discountCents" + "shippingCents"'),
      ('StockMovement', 'StockMovement_exactly_one_stock_target_check', '(CASE WHEN "productId" IS NULL THEN 0 ELSE 1 END + CASE WHEN "variantId" IS NULL THEN 0 ELSE 1 END) = 1'),
      ('StockMovement', 'StockMovement_quantity_matches_stock_delta_check', '"newStock" = "previousStock" + quantity'),
      ('StockMovement', 'StockMovement_sale_requires_order_check', 'type <> ''sale'' OR "orderId" IS NOT NULL'),
      ('StockMovement', 'StockMovement_direction_by_type_check', '(type = ''sale'' AND quantity < 0) OR (type IN (''restock'', ''return'') AND quantity > 0) OR (type = ''adjustment'' AND quantity <> 0)')
    ) AS checks(table_name, constraint_name, expression)
  LOOP
    IF to_regclass(format('%I', r.table_name)) IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM pg_constraint c
         WHERE c.conrelid = to_regclass(format('%I', r.table_name))
           AND c.conname = r.constraint_name
       ) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s) NOT VALID',
        r.table_name,
        r.constraint_name,
        r.expression
      );
    END IF;
  END LOOP;
END $$;

-- ─── Mercado Pago webhook/event idempotency ─────────────────────────────────
-- The payments worker can claim/process rows here using service_role. Browser
-- roles intentionally receive no access.

CREATE TABLE IF NOT EXISTS "MercadoPagoWebhookEvent" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT,
  "action" TEXT,
  "resourceId" TEXT,
  "paymentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "processedAt" TIMESTAMPTZ,
  "error" TEXT,
  CONSTRAINT "MercadoPagoWebhookEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MercadoPagoWebhookEvent_eventId_key" UNIQUE ("eventId"),
  CONSTRAINT "MercadoPagoWebhookEvent_status_check" CHECK ("status" IN ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED')),
  CONSTRAINT "MercadoPagoWebhookEvent_payload_object_check" CHECK (jsonb_typeof("payload") = 'object')
);

CREATE INDEX IF NOT EXISTS "MercadoPagoWebhookEvent_receivedAt_idx"
  ON "MercadoPagoWebhookEvent"("receivedAt" DESC);
CREATE INDEX IF NOT EXISTS "MercadoPagoWebhookEvent_status_receivedAt_idx"
  ON "MercadoPagoWebhookEvent"("status", "receivedAt");
CREATE INDEX IF NOT EXISTS "MercadoPagoWebhookEvent_paymentId_idx"
  ON "MercadoPagoWebhookEvent"("paymentId")
  WHERE "paymentId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "MercadoPagoWebhookEvent_resource_event_unique"
  ON "MercadoPagoWebhookEvent"("resourceId", "eventType")
  WHERE "resourceId" IS NOT NULL AND "eventType" IS NOT NULL;

ALTER TABLE IF EXISTS "MercadoPagoWebhookEvent" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_mercadopagowebhookevent" ON "MercadoPagoWebhookEvent";
CREATE POLICY "admin_all_mercadopagowebhookevent"
  ON "MercadoPagoWebhookEvent"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE "MercadoPagoWebhookEvent" FROM anon, authenticated;

COMMENT ON TABLE "MercadoPagoWebhookEvent" IS
  'Durable idempotency ledger for Mercado Pago webhook/events. Payment routes should insert eventId/resourceId first and process only rows they successfully claim.';
COMMENT ON COLUMN "MercadoPagoWebhookEvent"."eventId" IS
  'Unique provider event or notification id used as the primary idempotency key.';
COMMENT ON COLUMN "MercadoPagoWebhookEvent"."resourceId" IS
  'Provider resource/payment id when present; combined with eventType as a secondary dedupe key.';
