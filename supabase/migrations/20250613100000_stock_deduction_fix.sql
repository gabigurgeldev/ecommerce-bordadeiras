-- Idempotent stock deduction: skip already-deducted items and mark OrderItem.deductedStock

CREATE OR REPLACE FUNCTION deduct_stock_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  product_record RECORD;
  variant_record RECORD;
  current_stock INTEGER;
  new_stock INTEGER;
BEGIN
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    FOR item IN
      SELECT * FROM "OrderItem"
      WHERE "orderId" = NEW."orderId"
        AND COALESCE("deductedStock", false) = false
    LOOP
      IF item."variantId" IS NOT NULL THEN
        SELECT * INTO variant_record
        FROM "ProductVariant"
        WHERE id = item."variantId" AND "stockUnlimited" = false;

        IF FOUND THEN
          current_stock := variant_record.stock;
          new_stock := GREATEST(0, current_stock - item.quantity);

          UPDATE "ProductVariant"
          SET stock = new_stock,
              "soldCount" = "soldCount" + item.quantity,
              active = CASE WHEN new_stock = 0 THEN false ELSE active END
          WHERE id = item."variantId";

          INSERT INTO "StockMovement" (
            id, "variantId", type, quantity, "previousStock",
            "newStock", "orderId", notes
          ) VALUES (
            gen_random_uuid()::text, item."variantId", 'sale',
            -item.quantity, current_stock, new_stock, NEW."orderId",
            'Automatic deduction on payment approval'
          );

          UPDATE "OrderItem"
          SET "deductedStock" = true, "updatedAt" = now()
          WHERE id = item.id;
        END IF;
      ELSIF item."productId" IS NOT NULL THEN
        SELECT * INTO product_record
        FROM "Product"
        WHERE id = item."productId" AND "stockUnlimited" = false;

        IF FOUND THEN
          current_stock := product_record.stock;
          new_stock := GREATEST(0, current_stock - item.quantity);

          UPDATE "Product"
          SET stock = new_stock,
              active = CASE WHEN new_stock = 0 THEN false ELSE active END,
              status = CASE WHEN new_stock = 0 THEN 'OUT_OF_STOCK'::"ProductStatus" ELSE status END
          WHERE id = item."productId";

          INSERT INTO "StockMovement" (
            id, "productId", type, quantity, "previousStock",
            "newStock", "orderId", notes
          ) VALUES (
            gen_random_uuid()::text, item."productId", 'sale',
            -item.quantity, current_stock, new_stock, NEW."orderId",
            'Automatic deduction on payment approval'
          );

          UPDATE "OrderItem"
          SET "deductedStock" = true, "updatedAt" = now()
          WHERE id = item.id;
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
