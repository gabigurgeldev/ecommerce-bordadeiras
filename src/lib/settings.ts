import { prisma } from "@/lib/prisma";
import { SETTING_KEYS } from "@/lib/settings-keys";

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: keys } },
  });
  const map = Object.fromEntries(keys.map((k) => [k, ""]));
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setSettings(entries: Record<string, string>): Promise<void> {
  await prisma.$transaction(
    Object.entries(entries).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

/** Port 465 = implicit TLS; 587 = STARTTLS (secure: false). */
export function resolveSmtpSecure(port: number, explicit?: boolean): boolean {
  if (port === 465) return true;
  if (port === 587) return false;
  return explicit === true;
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
  const db = await prisma.setting.findMany({
    where: { key: { in: [...smtpKeys, ...legacyKeys] } },
  });
  const map = Object.fromEntries(db.map((s) => [s.key, s.value]));

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
