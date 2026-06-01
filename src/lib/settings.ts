import { prisma } from "@/lib/prisma";

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

export async function getMailSettings(): Promise<{
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}> {
  const env = {
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? "25"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "noreply@bordadeiras.local",
  };

  const keys = ["mail.host", "mail.port", "mail.secure", "mail.user", "mail.pass", "mail.from"] as const;
  const db = await prisma.setting.findMany({
    where: { key: { in: [...keys] } },
  });
  const map = Object.fromEntries(db.map((s) => [s.key, s.value]));

  return {
    host: map["mail.host"] ?? env.host,
    port: Number(map["mail.port"] ?? env.port),
    secure: (map["mail.secure"] ?? String(env.secure)) === "true",
    user: map["mail.user"] ?? env.user,
    pass: map["mail.pass"] ?? env.pass,
    from: map["mail.from"] ?? env.from,
  };
}
