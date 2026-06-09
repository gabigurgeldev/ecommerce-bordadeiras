-- Migration: Product videos (array), stock management, and variant improvements
-- Created: 2026-06-07

-- 1. Convert videoUrl to videoUrls array
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "videoUrls" TEXT[] DEFAULT '{}';

-- Migrate existing videoUrl to videoUrls array
UPDATE "Product" 
SET "videoUrls" = ARRAY["videoUrl"]
WHERE "videoUrl" IS NOT NULL AND "videoUrl" != '';

-- Drop old videoUrl column (optional - keep for rollback safety)
-- ALTER TABLE "Product" DROP COLUMN IF EXISTS "videoUrl";

-- 2. Add stock management fields to ProductVariant
ALTER TABLE "ProductVariant" 
  ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "stockUnlimited" BOOLEAN NOT NULL DEFAULT false;

-- 3. Add order items tracking for stock deduction
ALTER TABLE "OrderItem" 
  ADD COLUMN IF NOT EXISTS "variantId" TEXT,
  ADD COLUMN IF NOT EXISTS "deductedStock" BOOLEAN NOT NULL DEFAULT false;

-- Add foreign key for variantId
ALTER TABLE "OrderItem" 
  DROP CONSTRAINT IF EXISTS "OrderItem_variantId_fkey";
ALTER TABLE "OrderItem" 
  ADD CONSTRAINT "OrderItem_variantId_fkey" 
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL;

-- 4. Create index for stock deduction tracking
CREATE INDEX IF NOT EXISTS "OrderItem_deductedStock_idx" ON "OrderItem"("deductedStock");

-- 5. Add triggers for stock validation (optional - for strict stock control)
CREATE OR REPLACE FUNCTION check_product_stock()
RETURNS TRIGGER AS $$
DECLARE
  available_stock INTEGER;
  variant_stock INTEGER;
BEGIN
  -- Check if product has unlimited stock
  IF EXISTS (
    SELECT 1 FROM "Product" 
    WHERE id = NEW."productId" AND "stockUnlimited" = true
  ) THEN
    RETURN NEW;
  END IF;

  -- Check variant stock if variant is specified
  IF NEW."variantId" IS NOT NULL THEN
    SELECT "stock" INTO variant_stock
    FROM "ProductVariant"
    WHERE id = NEW."variantId" AND "stockUnlimited" = false;
    
    IF variant_stock IS NOT NULL AND variant_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient variant stock';
    END IF;
  ELSE
    -- Check product stock
    SELECT "stock" INTO available_stock
    FROM "Product"
    WHERE id = NEW."productId" AND "stockUnlimited" = false;
    
    IF available_stock IS NOT NULL AND available_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient product stock';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Add trigger for stock validation on order item insert
-- DROP TRIGGER IF EXISTS check_stock_before_insert ON "OrderItem";
-- CREATE TRIGGER check_stock_before_insert
--   BEFORE INSERT ON "OrderItem"
--   FOR EACH ROW
--   EXECUTE FUNCTION check_product_stock();
