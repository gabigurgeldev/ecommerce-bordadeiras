import { getDb, newId, TABLES } from "@/lib/supabase/db";

/**
 * Durable idempotency for Mercado Pago notifications, backed by
 * "MercadoPagoWebhookEvent" (unique eventId). Replaces the previous Redis-only
 * scheme, which failed open whenever REDIS_URL was unset.
 */

/** A PROCESSING row older than this is treated as abandoned by a crashed run. */
const STALE_PROCESSING_MS = 5 * 60 * 1000;

const UNIQUE_VIOLATION = "23505";

export type WebhookEventClaim =
  | { claimed: true; id: string }
  | { claimed: false; reason: "duplicate" | "in-progress" };

export async function claimWebhookEvent(input: {
  eventId: string;
  eventType?: string | null;
  action?: string | null;
  resourceId?: string | null;
  payload: unknown;
}): Promise<WebhookEventClaim> {
  const db = getDb();
  const id = newId();

  const { error } = await db.from(TABLES.MercadoPagoWebhookEvent).insert({
    id,
    eventId: input.eventId,
    eventType: input.eventType ?? null,
    action: input.action ?? null,
    resourceId: input.resourceId ?? null,
    status: "PROCESSING",
    payload: input.payload ?? {},
  });

  if (!error) return { claimed: true, id };
  if (error.code !== UNIQUE_VIOLATION) throw error;

  return reclaimWebhookEvent(input.eventId);
}

/**
 * A previous attempt already inserted this eventId. Retry it only when that
 * attempt failed or died mid-flight; anything else is a genuine duplicate.
 */
async function reclaimWebhookEvent(eventId: string): Promise<WebhookEventClaim> {
  const db = getDb();

  const { data: existing, error: lookupError } = await db
    .from(TABLES.MercadoPagoWebhookEvent)
    .select("id, status, receivedAt")
    .eq("eventId", eventId)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!existing) return { claimed: false, reason: "duplicate" };

  const status = String(existing.status);
  if (status === "PROCESSED") return { claimed: false, reason: "duplicate" };

  if (status === "PROCESSING") {
    const receivedAt = new Date(String(existing.receivedAt)).getTime();
    const stale =
      Number.isFinite(receivedAt) && Date.now() - receivedAt > STALE_PROCESSING_MS;
    if (!stale) return { claimed: false, reason: "in-progress" };
  }

  const { data: reclaimed, error: reclaimError } = await db
    .from(TABLES.MercadoPagoWebhookEvent)
    .update({
      status: "PROCESSING",
      receivedAt: new Date().toISOString(),
      processedAt: null,
      error: null,
    })
    .eq("id", existing.id)
    .eq("status", status)
    .select("id")
    .maybeSingle();
  if (reclaimError) throw reclaimError;
  if (!reclaimed) return { claimed: false, reason: "in-progress" };

  return { claimed: true, id: String(reclaimed.id) };
}

export async function markWebhookEvent(
  id: string,
  status: "PROCESSED" | "FAILED",
  details?: { paymentId?: string | null; error?: string | null },
): Promise<void> {
  const { error } = await getDb()
    .from(TABLES.MercadoPagoWebhookEvent)
    .update({
      status,
      processedAt: new Date().toISOString(),
      ...(details?.paymentId ? { paymentId: details.paymentId } : {}),
      error: details?.error ?? null,
    })
    .eq("id", id);

  // Never let bookkeeping mask the outcome of the notification itself.
  if (error) console.error("[webhook] event ledger update failed", error);
}
