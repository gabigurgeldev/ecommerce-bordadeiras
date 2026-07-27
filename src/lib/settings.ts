import { getDb, newId, TABLES, toIso } from "@/lib/supabase/db";
import { SETTING_KEYS } from "@/lib/settings-keys";

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const { data: rows } = await getDb()
    .from(TABLES.Setting)
    .select("key, value")
    .in("key", keys);
  const map = Object.fromEntries(keys.map((k) => [k, ""]));
  for (const row of rows ?? []) map[String(row.key)] = String(row.value);
  return map;
}

/**
 * One upsert instead of a select + update/insert per key (saving ~15 admin
 * settings meant ~30 sequential round trips), and the write errors are no
 * longer swallowed — a failed save used to report success.
 */
export async function setSettings(entries: Record<string, string>): Promise<void> {
  const rows = Object.entries(entries);
  if (rows.length === 0) return;

  const db = getDb();
  const keys = rows.map(([key]) => key);

  // Reuse the existing row ids: "key" is the conflict target, so sending a new
  // id would rewrite the primary key of every setting that already exists.
  const { data: existing, error: lookupError } = await db
    .from(TABLES.Setting)
    .select("id, key")
    .in("key", keys);
  if (lookupError) {
    throw new Error(
      `Não foi possível ler as configurações: ${lookupError.message}`,
    );
  }
  const idByKey = new Map(
    (existing ?? []).map((row) => [String(row.key), String(row.id)]),
  );

  const now = new Date().toISOString();
  const { error } = await db.from(TABLES.Setting).upsert(
    rows.map(([key, value]) => ({
      id: idByKey.get(key) ?? newId(),
      key,
      value,
      group: "general",
      updatedAt: now,
    })),
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(`Não foi possível salvar as configurações: ${error.message}`);
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const { data: row } = await getDb()
    .from(TABLES.Setting)
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return row?.value != null ? String(row.value) : null;
}

/** Port 465 = implicit TLS; 587 = STARTTLS (secure: false). */
export function resolveSmtpSecure(port: number, explicit?: boolean): boolean {
  if (port === 465) return true;
  if (port === 587) return false;
  return explicit === true;
}

/** Aceita certificado autoassinado (ex.: Stalwart interno). Use só se necessário. */
export function smtpTlsAllowInsecure(): boolean {
  return process.env.SMTP_TLS_INSECURE === "true";
}

export type MailSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export function isMailConfigured(cfg: MailSettings): boolean {
  if (!cfg.host || cfg.host === "localhost") return false;
  if (!cfg.user || !cfg.pass) return false;
  return true;
}

export async function getMailSettings(): Promise<MailSettings> {
  const env = {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "",
  };

  const smtpKeys = Object.values(SETTING_KEYS.smtp);
  const legacyKeys = [
    "mail.host",
    "mail.port",
    "mail.secure",
    "mail.user",
    "mail.pass",
    "mail.from",
  ] as const;
  const { data: db } = await getDb()
    .from(TABLES.Setting)
    .select("key, value")
    .in("key", [...smtpKeys, ...legacyKeys]);
  const map = Object.fromEntries((db ?? []).map((s) => [String(s.key), String(s.value)]));

  const pick = (smtpKey: string, legacyKey: string, fallback: string) =>
    map[smtpKey] || map[legacyKey] || fallback;

  const port = Number(pick(SETTING_KEYS.smtp.port, "mail.port", String(env.port))) || 587;
  const secureRaw = map["mail.secure"];
  const secureExplicit =
    secureRaw === "true" ? true : secureRaw === "false" ? false : env.secure;

  return {
    host: pick(SETTING_KEYS.smtp.host, "mail.host", env.host),
    port,
    secure: resolveSmtpSecure(port, secureExplicit),
    user: pick(SETTING_KEYS.smtp.user, "mail.user", env.user),
    pass: pick(SETTING_KEYS.smtp.password, "mail.pass", env.pass),
    from: pick(SETTING_KEYS.smtp.from, "mail.from", env.from),
  };
}
