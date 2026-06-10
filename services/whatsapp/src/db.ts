import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL must be set");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const TABLE = "WhatsappSession";
const RECIPIENT_TABLE = "WhatsappRecipient";
const TEMPLATE_TABLE = "WhatsappTemplate";

export async function loadSession(sessionId = "default") {
  const { data, error } = await getClient()
    .from(TABLE)
    .select("*")
    .eq("sessionId", sessionId)
    .maybeSingle();
  if (error) throw error;
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
    if (error) throw error;
    return row;
  }

  const { data: row, error } = await db.from(TABLE).insert({
    ...payload,
    createdAt: now,
  }).select().single();
  if (error) throw error;
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
  const { data, error } = await getClient()
    .from(RECIPIENT_TABLE)
    .select("*")
    .eq("active", true)
    .order("createdAt", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Template functions
export async function getTemplateByKey(key: string) {
  const { data, error } = await getClient()
    .from(TEMPLATE_TABLE)
    .select("*")
    .eq("key", key)
    .eq("active", true)
    .maybeSingle();
  if (error) {
    console.error("[db] getTemplateByKey error:", error);
    return null;
  }
  return data;
}

export async function getTemplatesByEvent(event: string) {
  const { data, error } = await getClient()
    .from(TEMPLATE_TABLE)
    .select("*")
    .eq("event", event)
    .eq("active", true);
  if (error) {
    console.error("[db] getTemplatesByEvent error:", error);
    return [];
  }
  return data ?? [];
}

export async function getTemplateForRecipient(event: string, recipientType: "CUSTOMER" | "ADMIN") {
  const { data, error } = await getClient()
    .from(TEMPLATE_TABLE)
    .select("*")
    .eq("event", event)
    .eq("recipientType", recipientType)
    .eq("active", true)
    .maybeSingle();
  if (error) {
    console.error("[db] getTemplateForRecipient error:", error);
    return null;
  }
  return data;
}
