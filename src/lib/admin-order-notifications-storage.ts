const STORAGE_KEY = "bordadeiras-admin-orders-seen-at";

export function getLastSeenAt(): string {
  if (typeof window === "undefined") return new Date(0).toISOString();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return raw;
  } catch {
    /* ignore */
  }
  return new Date(0).toISOString();
}

export function markOrdersSeenNow(): string {
  const now = new Date().toISOString();
  if (typeof window === "undefined") return now;
  try {
    localStorage.setItem(STORAGE_KEY, now);
  } catch {
    /* ignore */
  }
  return now;
}
