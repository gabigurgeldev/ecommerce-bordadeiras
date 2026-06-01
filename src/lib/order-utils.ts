/** Generates a human-readable order number (e.g. BRD-20260601-A1B2C3). */
export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BRD-${y}${m}${d}-${suffix}`;
}
