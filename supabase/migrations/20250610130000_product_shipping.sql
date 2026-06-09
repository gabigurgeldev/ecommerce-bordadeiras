-- Product shipping modes and origin/shipping settings keys

CREATE TYPE "ShippingMode" AS ENUM ('FREE', 'FIXED', 'CORREIOS');

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "shippingMode" "ShippingMode" NOT NULL DEFAULT 'CORREIOS',
  ADD COLUMN IF NOT EXISTS "fixedShippingCents" INTEGER;
