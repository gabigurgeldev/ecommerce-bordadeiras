import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const TABLE = "WhatsappSession";
const RECIPIENT_TABLE = "WhatsappRecipient";
const TEMPLATE_TABLE = "WhatsappTemplate";

let warnedMissingConfig = false;

function resolveSupabaseUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    undefined
  );
}

function resolveServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined;
}

export function getSupabaseConfigStatus(): {
  configured: boolean;
  url?: string;
  missing: string[];
} {
  const url = resolveSupabaseUrl();
  const key = resolveServiceRoleKey();
  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL");
  if (!key) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return { configured: missing.length === 0, url, missing };
}

function warnMissingConfig(context: string) {
  if (warnedMissingConfig) return;
  warnedMissingConfig = true;
  const { missing } = getSupabaseConfigStatus();
  console.warn(
    `[whatsapp/db] Supabase não configurado (${context}). Defina no serviço whatsapp: ${missing.join(", ")}`,
  );
}

function getClient(): SupabaseClient | null {
  const url = resolveSupabaseUrl();
  const key = resolveServiceRoleKey();
  if (!url || !key) {
    warnMissingConfig("operação ignorada");
    return null;
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function loadSession(sessionId = "default") {
  const db = getClient();
  if (!db) return null;

  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("sessionId", sessionId)
    .maybeSingle();
  if (error) {
    console.error("[whatsapp/db] loadSession error:", error);
    return null;
  }
  return data;
}

export async function saveSession(
  sessionId: string,
  data: {
    creds?: object | null;
    keys?: object | null;
    status: string;
    qrCode?: string | null;
  },
) {
  const db = getClient();
  if (!db) return null;

  const now = new Date().toISOString();
  const { data: existing } = await db
    .from(TABLE)
    .select("id")
    .eq("sessionId", sessionId)
    .maybeSingle();

  const payload = {
    sessionId,
    creds: data.creds ?? null,
    keys: data.keys ?? null,
    status: data.status,
    qrCode: data.qrCode ?? null,
    updatedAt: now,
  };

  if (existing) {
    const { data: row, error } = await db
      .from(TABLE)
      .update(payload)
      .eq("sessionId", sessionId)
      .select()
      .single();
    if (error) {
      console.error("[whatsapp/db] saveSession update error:", error);
      return null;
    }
    return row;
  }

  const { data: row, error } = await db.from(TABLE).insert({
    ...payload,
    createdAt: now,
  }).select().single();
  if (error) {
    console.error("[whatsapp/db] saveSession insert error:", error);
    return null;
  }
  return row;
}

export async function clearSession(sessionId = "default") {
  return saveSession(sessionId, {
    status: "disconnected",
    creds: null,
    keys: null,
    qrCode: null,
  });
}

export async function getActiveRecipients() {
  const db = getClient();
  if (!db) return [];

  const { data, error } = await db
    .from(RECIPIENT_TABLE)
    .select("*")
    .eq("active", true)
    .order("createdAt", { ascending: true });
  if (error) {
    console.error("[whatsapp/db] getActiveRecipients error:", error);
    return [];
  }
  return data ?? [];
}

export async function getTemplateByKey(key: string) {
  const db = getClient();
  if (!db) return null;

  const { data, error } = await db
    .from(TEMPLATE_TABLE)
    .select("*")
    .eq("key", key)
    .eq("active", true)
    .maybeSingle();
  if (error) {
    console.error("[whatsapp/db] getTemplateByKey error:", error);
    return null;
  }
  return data;
}

export async function getTemplatesByEvent(event: string) {
  const db = getClient();
  if (!db) return [];

  const { data, error } = await db
    .from(TEMPLATE_TABLE)
    .select("*")
    .eq("event", event)
    .eq("active", true);
  if (error) {
    console.error("[whatsapp/db] getTemplatesByEvent error:", error);
    return [];
  }
  return data ?? [];
}

export async function getTemplateForRecipient(
  event: string,
  recipientType: "CUSTOMER" | "ADMIN",
) {
  const db = getClient();
  if (!db) return null;

  const { data, error } = await db
    .from(TEMPLATE_TABLE)
    .select("*")
    .eq("event", event)
    .eq("recipientType", recipientType)
    .eq("active", true)
    .order("isDefault", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[whatsapp/db] getTemplateForRecipient error:", error);
    return null;
  }
  return data;
}
