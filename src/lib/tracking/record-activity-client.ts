import type { CustomerActivityType } from "@/lib/types/database";

type ActivityPayload = {
  type: CustomerActivityType;
  path?: string | null;
  productId?: string | null;
  productName?: string | null;
  metadata?: Record<string, unknown> | null;
};

let queue: ActivityPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushQueue();
  }, 300);
}

async function flushQueue() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, 5);
  for (const item of batch) {
    try {
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        keepalive: true,
      });
    } catch {
      // best-effort tracking
    }
  }
  if (queue.length > 0) scheduleFlush();
}

export function recordActivityClient(payload: ActivityPayload): void {
  if (typeof window === "undefined") return;
  queue.push(payload);
  scheduleFlush();
}
