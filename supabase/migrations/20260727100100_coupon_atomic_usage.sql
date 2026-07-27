-- Atomic coupon redemption counter.
--
-- incrementCouponUsageOnPaymentApproved used to read usedCount and write back
-- usedCount + 1 from JS. Two payments approved concurrently read the same value
-- and both wrote the same increment, letting a coupon be redeemed past maxUses.
--
-- Returns true when the counter was incremented, false when the coupon is gone
-- or already exhausted.

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE "Coupon"
  SET "usedCount" = "usedCount" + 1,
      "updatedAt" = now()
  WHERE id = coupon_id
    AND ("maxUses" IS NULL OR "usedCount" < "maxUses");

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_coupon_usage(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_coupon_usage(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.increment_coupon_usage(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(TEXT) TO service_role;
