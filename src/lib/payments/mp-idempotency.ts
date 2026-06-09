export function mpIdempotencyKey(
  orderId: string,
  method: string,
  suffix?: string,
): string {
  const base = `checkout-${orderId}-${method}`;
  if (!suffix) return base.slice(0, 150);
  const key = `${base}-${suffix}`;
  return key.slice(0, 150);
}
