-- Extended product fields + variants
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "brand" TEXT,
  ADD COLUMN IF NOT EXISTS "costCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "showPrice" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "stockUnlimited" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER,
  ADD COLUMN IF NOT EXISTS "lengthCm" INTEGER,
  ADD COLUMN IF NOT EXISTS "widthCm" INTEGER,
  ADD COLUMN IF NOT EXISTS "heightCm" INTEGER,
  ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;

CREATE TABLE IF NOT EXISTS "ProductOption" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductOption_productId_idx" ON "ProductOption"("productId");

ALTER TABLE "ProductOption"
  DROP CONSTRAINT IF EXISTS "ProductOption_productId_fkey";
ALTER TABLE "ProductOption"
  ADD CONSTRAINT "ProductOption_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ProductOptionValue" (
  "id" TEXT NOT NULL,
  "optionId" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductOptionValue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductOptionValue_optionId_idx" ON "ProductOptionValue"("optionId");

ALTER TABLE "ProductOptionValue"
  DROP CONSTRAINT IF EXISTS "ProductOptionValue_optionId_fkey";
ALTER TABLE "ProductOptionValue"
  ADD CONSTRAINT "ProductOptionValue_optionId_fkey"
  FOREIGN KEY ("optionId") REFERENCES "ProductOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sku" TEXT,
  "priceCents" INTEGER,
  "compareCents" INTEGER,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "stockUnlimited" BOOLEAN NOT NULL DEFAULT false,
  "attributes" JSONB NOT NULL DEFAULT '{}',
  "imageUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");

ALTER TABLE "ProductVariant"
  DROP CONSTRAINT IF EXISTS "ProductVariant_productId_fkey";
ALTER TABLE "ProductVariant"
  ADD CONSTRAINT "ProductVariant_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
