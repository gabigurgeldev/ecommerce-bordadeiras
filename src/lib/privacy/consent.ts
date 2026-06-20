import { getDb, TABLES } from "@/lib/supabase/db";
import type { CustomerActivityType } from "@/lib/types/database";
import { CustomerActivityType as ActivityType } from "@/lib/types/database";

export type NotificationPrefs = {
  orderUpdates: boolean;
  promotions: boolean;
  email: boolean;
  whatsapp: boolean;
  behavioralAnalytics: boolean;
  aiPersonalization: boolean;
  consentUpdatedAt: string | null;
};

export type OutreachPurpose = "pending_payment" | "abandoned_cart" | "marketing";

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  orderUpdates: true,
  promotions: false,
  email: true,
  whatsapp: false,
  behavioralAnalytics: false,
  aiPersonalization: false,
  consentUpdatedAt: null,
};

export function normalizeNotificationPrefs(input: unknown): NotificationPrefs {
  if (!input || typeof input !== "object") return DEFAULT_NOTIFICATION_PREFS;

  const raw = input as Partial<Record<keyof NotificationPrefs, unknown>>;
  return {
    orderUpdates:
      typeof raw.orderUpdates === "boolean"
        ? raw.orderUpdates
        : DEFAULT_NOTIFICATION_PREFS.orderUpdates,
    promotions:
      typeof raw.promotions === "boolean"
        ? raw.promotions
        : DEFAULT_NOTIFICATION_PREFS.promotions,
    email:
      typeof raw.email === "boolean" ? raw.email : DEFAULT_NOTIFICATION_PREFS.email,
    whatsapp:
      typeof raw.whatsapp === "boolean"
        ? raw.whatsapp
        : DEFAULT_NOTIFICATION_PREFS.whatsapp,
    behavioralAnalytics:
      typeof raw.behavioralAnalytics === "boolean"
        ? raw.behavioralAnalytics
        : DEFAULT_NOTIFICATION_PREFS.behavioralAnalytics,
    aiPersonalization:
      typeof raw.aiPersonalization === "boolean"
        ? raw.aiPersonalization
        : DEFAULT_NOTIFICATION_PREFS.aiPersonalization,
    consentUpdatedAt:
      typeof raw.consentUpdatedAt === "string" ? raw.consentUpdatedAt : null,
  };
}

export async function getUserNotificationPrefs(
  userId: string,
): Promise<NotificationPrefs> {
  const db = getDb();
  const { data } = await db
    .from(TABLES.User)
    .select("notificationPrefs")
    .eq("id", userId)
    .maybeSingle();

  return normalizeNotificationPrefs(data?.notificationPrefs);
}

export function canRecordCustomerActivity(
  type: CustomerActivityType,
  prefs: NotificationPrefs,
): boolean {
  const behavioralTypes = new Set<CustomerActivityType>([
    ActivityType.PAGE_VIEW,
    ActivityType.PRODUCT_VIEW,
    ActivityType.ADD_TO_CART,
    ActivityType.REMOVE_FROM_CART,
    ActivityType.BEGIN_CHECKOUT,
    ActivityType.SEARCH,
  ]);

  return behavioralTypes.has(type) ? prefs.behavioralAnalytics : false;
}

export function resolveOutreachPurpose(
  templateKey?: string | null,
): OutreachPurpose {
  if (templateKey === "outreach_pending_payment") return "pending_payment";
  if (templateKey === "outreach_abandoned_cart") return "abandoned_cart";
  return "marketing";
}

export function canUseWhatsappOutreach(
  prefs: NotificationPrefs,
  purpose: OutreachPurpose,
): boolean {
  if (!prefs.whatsapp) return false;
  if (purpose === "pending_payment") return prefs.orderUpdates;
  return prefs.promotions;
}

export function describeWhatsappOutreachRequirement(
  purpose: OutreachPurpose,
): string {
  if (purpose === "pending_payment") {
    return "Cliente não autorizou avisos de pedido por WhatsApp.";
  }
  return "Cliente não autorizou contatos promocionais por WhatsApp.";
}

export function maskPhoneForAudit(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/g, "[telefone]");
}

export function sanitizeActivityPayload(input: {
  path?: string | null;
  productId?: string | null;
  productName?: string | null;
  metadata?: Record<string, unknown> | null;
}): {
  path: string | null;
  productId: string | null;
  productName: string | null;
  metadata: Record<string, unknown> | null;
} {
  const metadata: Record<string, unknown> = {};

  if (input.metadata && typeof input.metadata === "object") {
    const quantity = input.metadata.quantity;
    if (typeof quantity === "number" && Number.isFinite(quantity)) {
      metadata.quantity = quantity;
    }

    const variantId = input.metadata.variantId;
    if (typeof variantId === "string") {
      metadata.variantId = variantId.slice(0, 100);
    } else if (variantId === null) {
      metadata.variantId = null;
    }

    const query = input.metadata.query;
    if (typeof query === "string") {
      metadata.query = redactSensitiveText(query).trim().slice(0, 80);
    }
  }

  return {
    path: input.path ? redactSensitiveText(input.path).slice(0, 500) : null,
    productId: input.productId ? input.productId.slice(0, 100) : null,
    productName: input.productName
      ? redactSensitiveText(input.productName).slice(0, 300)
      : null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  };
}
