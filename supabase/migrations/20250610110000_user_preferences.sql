ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "notificationPrefs" JSONB
  DEFAULT '{"orderUpdates":true,"promotions":false,"email":true}'::jsonb;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "mercadoPagoCustomerId" TEXT;
