-- Security hardening for tables created after the initial RLS baseline.
-- Service-role/server data access keeps bypassing RLS; browser access stays policy-bound.

-- ─── RLS for post-baseline catalog and stock tables ──────────────────────────

ALTER TABLE IF EXISTS "ProductOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ProductOptionValue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "StockMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ProductReview" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_product_options" ON "ProductOption";
CREATE POLICY "public_read_product_options"
  ON "ProductOption"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Product" p
      WHERE p.id = "ProductOption"."productId"
        AND p.active = true
        AND p.status = 'ACTIVE'::"ProductStatus"
    )
  );

DROP POLICY IF EXISTS "public_read_product_option_values" ON "ProductOptionValue";
CREATE POLICY "public_read_product_option_values"
  ON "ProductOptionValue"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "ProductOption" po
      JOIN "Product" p ON p.id = po."productId"
      WHERE po.id = "ProductOptionValue"."optionId"
        AND p.active = true
        AND p.status = 'ACTIVE'::"ProductStatus"
    )
  );

DROP POLICY IF EXISTS "public_read_active_product_variants" ON "ProductVariant";
CREATE POLICY "public_read_active_product_variants"
  ON "ProductVariant"
  FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND EXISTS (
      SELECT 1
      FROM "Product" p
      WHERE p.id = "ProductVariant"."productId"
        AND p.active = true
        AND p.status = 'ACTIVE'::"ProductStatus"
    )
  );

DROP POLICY IF EXISTS "public_read_product_reviews" ON "ProductReview";
CREATE POLICY "public_read_product_reviews"
  ON "ProductReview"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Product" p
      WHERE p.id = "ProductReview"."productId"
        AND p.active = true
        AND p.status = 'ACTIVE'::"ProductStatus"
    )
  );

DROP POLICY IF EXISTS "admin_all_productoption" ON "ProductOption";
CREATE POLICY "admin_all_productoption"
  ON "ProductOption"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_productoptionvalue" ON "ProductOptionValue";
CREATE POLICY "admin_all_productoptionvalue"
  ON "ProductOptionValue"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_productvariant" ON "ProductVariant";
CREATE POLICY "admin_all_productvariant"
  ON "ProductVariant"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_stockmovement" ON "StockMovement";
CREATE POLICY "admin_all_stockmovement"
  ON "StockMovement"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_productreview" ON "ProductReview";
CREATE POLICY "admin_all_productreview"
  ON "ProductReview"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Defensive constraints for future writes ─────────────────────────────────
-- NOT VALID avoids scanning or rejecting historical data during deploy; new and
-- updated rows are still checked by PostgreSQL.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('Product', 'Product_priceCents_nonnegative_check', '"priceCents" >= 0'),
      ('Product', 'Product_compareCents_nonnegative_check', '"compareCents" IS NULL OR "compareCents" >= 0'),
      ('Product', 'Product_stock_nonnegative_check', 'stock >= 0'),
      ('Product', 'Product_costCents_nonnegative_check', '"costCents" IS NULL OR "costCents" >= 0'),
      ('Product', 'Product_weightGrams_nonnegative_check', '"weightGrams" IS NULL OR "weightGrams" >= 0'),
      ('Product', 'Product_lengthCm_nonnegative_check', '"lengthCm" IS NULL OR "lengthCm" >= 0'),
      ('Product', 'Product_widthCm_nonnegative_check', '"widthCm" IS NULL OR "widthCm" >= 0'),
      ('Product', 'Product_heightCm_nonnegative_check', '"heightCm" IS NULL OR "heightCm" >= 0'),
      ('Product', 'Product_fixedShippingCents_nonnegative_check', '"fixedShippingCents" IS NULL OR "fixedShippingCents" >= 0'),
      ('ProductOption', 'ProductOption_sortOrder_nonnegative_check', '"sortOrder" >= 0'),
      ('ProductOptionValue', 'ProductOptionValue_sortOrder_nonnegative_check', '"sortOrder" >= 0'),
      ('ProductVariant', 'ProductVariant_priceCents_nonnegative_check', '"priceCents" IS NULL OR "priceCents" >= 0'),
      ('ProductVariant', 'ProductVariant_compareCents_nonnegative_check', '"compareCents" IS NULL OR "compareCents" >= 0'),
      ('ProductVariant', 'ProductVariant_costCents_nonnegative_check', '"costCents" IS NULL OR "costCents" >= 0'),
      ('ProductVariant', 'ProductVariant_stock_nonnegative_check', 'stock >= 0'),
      ('ProductVariant', 'ProductVariant_lowStockThreshold_nonnegative_check', '"lowStockThreshold" IS NULL OR "lowStockThreshold" >= 0'),
      ('ProductVariant', 'ProductVariant_soldCount_nonnegative_check', '"soldCount" >= 0'),
      ('Order', 'Order_subtotalCents_nonnegative_check', '"subtotalCents" >= 0'),
      ('Order', 'Order_discountCents_nonnegative_check', '"discountCents" >= 0'),
      ('Order', 'Order_shippingCents_nonnegative_check', '"shippingCents" >= 0'),
      ('Order', 'Order_totalCents_nonnegative_check', '"totalCents" >= 0'),
      ('OrderItem', 'OrderItem_quantity_positive_check', 'quantity > 0'),
      ('OrderItem', 'OrderItem_priceCents_nonnegative_check', '"priceCents" >= 0'),
      ('Payment', 'Payment_amountCents_nonnegative_check', '"amountCents" >= 0'),
      ('Payment', 'Payment_metadata_object_check', 'metadata IS NULL OR jsonb_typeof(metadata) = ''object'''),
      ('Coupon', 'Coupon_value_nonnegative_check', 'value >= 0'),
      ('Coupon', 'Coupon_minCents_nonnegative_check', '"minCents" IS NULL OR "minCents" >= 0'),
      ('Coupon', 'Coupon_maxUses_nonnegative_check', '"maxUses" IS NULL OR "maxUses" >= 0'),
      ('Coupon', 'Coupon_usedCount_nonnegative_check', '"usedCount" >= 0'),
      ('CartItem', 'CartItem_quantity_positive_check', 'quantity > 0'),
      ('StockMovement', 'StockMovement_quantity_nonzero_check', 'quantity <> 0'),
      ('StockMovement', 'StockMovement_previousStock_nonnegative_check', '"previousStock" >= 0'),
      ('StockMovement', 'StockMovement_newStock_nonnegative_check', '"newStock" >= 0')
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

COMMENT ON COLUMN "Payment"."metadata" IS
  'Provider metadata is for reconciliation/support only. Do not store PAN, CVV, payment tokens, or customer PII beyond operational need; purge raw provider payloads after the support/chargeback window.';

COMMENT ON TABLE "StockMovement" IS
  'Inventory audit trail retained for operational/accounting support. Keep payment/customer details out of notes.';

-- ─── Atomic stock deduction on approved payments ─────────────────────────────

CREATE OR REPLACE FUNCTION public.deduct_stock_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  current_stock INTEGER;
  new_stock INTEGER;
BEGIN
  IF NEW.status != 'APPROVED'::"PaymentStatus" THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'APPROVED'::"PaymentStatus" THEN
    RETURN NEW;
  END IF;

  FOR item IN
    SELECT *
    FROM "OrderItem"
    WHERE "orderId" = NEW."orderId"
      AND COALESCE("deductedStock", false) = false
    ORDER BY id
    FOR UPDATE
  LOOP
    IF item.quantity IS NULL OR item.quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for order item %', item.id
        USING ERRCODE = 'P0001';
    END IF;

    IF item."variantId" IS NOT NULL THEN
      UPDATE "ProductVariant"
      SET stock = stock - item.quantity,
          "soldCount" = "soldCount" + item.quantity,
          active = CASE WHEN stock - item.quantity = 0 THEN false ELSE active END
      WHERE id = item."variantId"
        AND "stockUnlimited" = false
        AND stock >= item.quantity
      RETURNING stock + item.quantity, stock
      INTO current_stock, new_stock;

      IF FOUND THEN
        INSERT INTO "StockMovement" (
          id, "variantId", type, quantity, "previousStock",
          "newStock", "orderId", notes
        ) VALUES (
          gen_random_uuid()::text, item."variantId", 'sale',
          -item.quantity, current_stock, new_stock, NEW."orderId",
          'Automatic deduction on payment approval'
        );

        UPDATE "OrderItem"
        SET "deductedStock" = true
        WHERE id = item.id;
      ELSIF EXISTS (
        SELECT 1 FROM "ProductVariant"
        WHERE id = item."variantId" AND "stockUnlimited" = true
      ) THEN
        UPDATE "OrderItem"
        SET "deductedStock" = true
        WHERE id = item.id;
      ELSIF EXISTS (
        SELECT 1 FROM "ProductVariant"
        WHERE id = item."variantId"
      ) THEN
        RAISE EXCEPTION 'Insufficient variant stock for order item %', item.id
          USING ERRCODE = 'P0001';
      ELSE
        RAISE EXCEPTION 'Product variant % not found for order item %', item."variantId", item.id
          USING ERRCODE = 'P0001';
      END IF;
    ELSIF item."productId" IS NOT NULL THEN
      UPDATE "Product"
      SET stock = stock - item.quantity,
          active = CASE WHEN stock - item.quantity = 0 THEN false ELSE active END,
          status = CASE
            WHEN stock - item.quantity = 0 THEN 'OUT_OF_STOCK'::"ProductStatus"
            ELSE status
          END
      WHERE id = item."productId"
        AND "stockUnlimited" = false
        AND stock >= item.quantity
      RETURNING stock + item.quantity, stock
      INTO current_stock, new_stock;

      IF FOUND THEN
        INSERT INTO "StockMovement" (
          id, "productId", type, quantity, "previousStock",
          "newStock", "orderId", notes
        ) VALUES (
          gen_random_uuid()::text, item."productId", 'sale',
          -item.quantity, current_stock, new_stock, NEW."orderId",
          'Automatic deduction on payment approval'
        );

        UPDATE "OrderItem"
        SET "deductedStock" = true
        WHERE id = item.id;
      ELSIF EXISTS (
        SELECT 1 FROM "Product"
        WHERE id = item."productId" AND "stockUnlimited" = true
      ) THEN
        UPDATE "OrderItem"
        SET "deductedStock" = true
        WHERE id = item.id;
      ELSIF EXISTS (
        SELECT 1 FROM "Product"
        WHERE id = item."productId"
      ) THEN
        RAISE EXCEPTION 'Insufficient product stock for order item %', item.id
          USING ERRCODE = 'P0001';
      ELSE
        RAISE EXCEPTION 'Product % not found for order item %', item."productId", item.id
          USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deduct_stock_on_payment ON "Payment";
CREATE TRIGGER trg_deduct_stock_on_payment
  AFTER UPDATE OF status ON "Payment"
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_payment();

DROP TRIGGER IF EXISTS trg_deduct_stock_on_payment_insert ON "Payment";
CREATE TRIGGER trg_deduct_stock_on_payment_insert
  AFTER INSERT ON "Payment"
  FOR EACH ROW
  WHEN (NEW.status = 'APPROVED')
  EXECUTE FUNCTION public.deduct_stock_on_payment();
