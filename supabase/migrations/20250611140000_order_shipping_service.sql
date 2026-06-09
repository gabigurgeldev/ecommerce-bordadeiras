-- Persist selected Melhor Envio service on orders

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "shippingServiceId" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingServiceName" TEXT;
