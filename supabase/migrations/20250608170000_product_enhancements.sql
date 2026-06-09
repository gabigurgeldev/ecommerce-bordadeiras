-- Product enhancements: multiple videos, improved variants, stock management

-- 1. Add videoUrls array to Product table (replaces single videoUrl)
ALTER TABLE "Product" 
  ADD COLUMN IF NOT EXISTS "videoUrls" TEXT[] DEFAULT '{}';

-- Migrate existing videoUrl to videoUrls array
DO $$
BEGIN
  UPDATE "Product" 
  SET "videoUrls" = ARRAY["videoUrl"]
  WHERE "videoUrl" IS NOT NULL AND "videoUrl" != '' AND "videoUrls" = '{}';
END $$;

-- 2. Enhance ProductVariant with better stock and pricing control
ALTER TABLE "ProductVariant"
  ADD COLUMN IF NOT EXISTS "costCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "lowStockThreshold" INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "soldCount" INTEGER NOT NULL DEFAULT 0;

-- Add unique constraint on SKU at database level
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_sku_unique" 
  ON "ProductVariant"("sku") 
  WHERE "sku" IS NOT NULL AND "sku" != '';

-- Add index for faster variant lookups
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_active_idx" 
  ON "ProductVariant"("productId", "active");

-- 3. Create stock movement tracking table
CREATE TABLE IF NOT EXISTS "StockMovement" (
  "id" TEXT NOT NULL,
  "productId" TEXT,
  "variantId" TEXT,
  "type" TEXT NOT NULL, -- 'sale', 'restock', 'adjustment', 'return'
  "quantity" INTEGER NOT NULL,
  "previousStock" INTEGER NOT NULL,
  "newStock" INTEGER NOT NULL,
  "orderId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StockMovement_type_check" CHECK ("type" IN ('sale', 'restock', 'adjustment', 'return'))
);

-- Indexes for stock movement
CREATE INDEX IF NOT EXISTS "StockMovement_productId_idx" ON "StockMovement"("productId");
CREATE INDEX IF NOT EXISTS "StockMovement_variantId_idx" ON "StockMovement"("variantId");
CREATE INDEX IF NOT EXISTS "StockMovement_orderId_idx" ON "StockMovement"("orderId");
CREATE INDEX IF NOT EXISTS "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- Foreign keys for stock movement
ALTER TABLE "StockMovement"
  DROP CONSTRAINT IF EXISTS "StockMovement_productId_fkey",
  DROP CONSTRAINT IF EXISTS "StockMovement_variantId_fkey",
  DROP CONSTRAINT IF EXISTS "StockMovement_orderId_fkey";

ALTER TABLE "StockMovement"
  ADD CONSTRAINT "StockMovement_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "StockMovement_variantId_fkey" 
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "StockMovement_orderId_fkey" 
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Function to deduct stock on order payment
CREATE OR REPLACE FUNCTION deduct_stock_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  product_record RECORD;
  variant_record RECORD;
  current_stock INTEGER;
  new_stock INTEGER;
BEGIN
  -- Only process when payment status changes to APPROVED
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    -- Get order items
    FOR item IN 
      SELECT * FROM "OrderItem" WHERE "orderId" = NEW."orderId"
    LOOP
      -- Handle variant stock
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
          
          -- Log stock movement
          INSERT INTO "StockMovement" (
            id, "variantId", type, quantity, "previousStock", 
            "newStock", "orderId", notes
          ) VALUES (
            gen_random_uuid()::text, item."variantId", 'sale', 
            -item.quantity, current_stock, new_stock, NEW."orderId",
            'Automatic deduction on payment approval'
          );
        END IF;
      -- Handle main product stock (if no variant)
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
          
          -- Log stock movement
          INSERT INTO "StockMovement" (
            id, "productId", type, quantity, "previousStock", 
            "newStock", "orderId", notes
          ) VALUES (
            gen_random_uuid()::text, item."productId", 'sale', 
            -item.quantity, current_stock, new_stock, NEW."orderId",
            'Automatic deduction on payment approval'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_deduct_stock_on_payment ON "Payment";

-- Create trigger on Payment table
CREATE TRIGGER trg_deduct_stock_on_payment
  AFTER UPDATE OF status ON "Payment"
  FOR EACH ROW
  EXECUTE FUNCTION deduct_stock_on_payment();

-- Also handle INSERT for immediate APPROVED payments
DROP TRIGGER IF EXISTS trg_deduct_stock_on_payment_insert ON "Payment";

CREATE TRIGGER trg_deduct_stock_on_payment_insert
  AFTER INSERT ON "Payment"
  FOR EACH ROW
  WHEN (NEW.status = 'APPROVED')
  EXECUTE FUNCTION deduct_stock_on_payment();
