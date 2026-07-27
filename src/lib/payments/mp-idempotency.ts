/**
 * Mercado Pago replays the cached response of a previous request with the same
 * X-Idempotency-Key. A pending order keeps its id while the cart changes, so the
 * amount has to be part of the key — otherwise regenerating a PIX/boleto returns
 * the old, cheaper payment and the customer underpays.
 */
export function mpIdempotencyKey(
  orderId: string,
  method: string,
  amountCents: number,
  suffix?: string,
): string {
  const base = `checkout-${orderId}-${method}-${amountCents}`;
  if (!suffix) return base.slice(0, 150);
  const key = `${base}-${suffix}`;
  return key.slice(0, 150);
}
