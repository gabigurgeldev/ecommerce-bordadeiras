import type { CustomerActivityType } from "@/lib/types/database";

const ACTIVITY_CONSENT_STORAGE_KEY = "bordadeiras:behavioral-analytics-consent";

type ActivityPayload = {
  type: CustomerActivityType;
  path?: string | null;
  productId?: string | null;
  productName?: string | null;
  metadata?: Record<string, unknown> | null;
};

let queue: ActivityPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let behavioralAnalyticsConsent: boolean | null = null;

function readStoredConsent(): boolean {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(ACTIVITY_CONSENT_STORAGE_KEY);
  return stored === "true";
}

function hasBehavioralAnalyticsConsent(): boolean {
  return behavioralAnalyticsConsent ?? readStoredConsent();
}

export function configureActivityConsent(consented: boolean): void {
  behavioralAnalyticsConsent = consented;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ACTIVITY_CONSENT_STORAGE_KEY,
    consented ? "true" : "false",
  );
  if (!consented) {
    queue = [];
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  }
}

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
  if (!hasBehavioralAnalyticsConsent()) return;
  queue.push(payload);
  scheduleFlush();
}
