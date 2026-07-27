-- Add missing createdAt/updatedAt columns to "OrderItem".
--
-- Both the app-layer stock deduction (src/lib/data/deduct-order-stock.ts) and the
-- deduct_stock_on_payment trigger (20250613100000_stock_deduction_fix.sql) write
-- "OrderItem"."updatedAt", but the column was never created in the foundation
-- migration. PostgREST answered PGRST204 and the trigger aborted the Payment
-- UPDATE that fired it, so approved orders never had their stock deducted,
-- coupon usage incremented, or confirmation e-mail/WhatsApp dispatched.

ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
