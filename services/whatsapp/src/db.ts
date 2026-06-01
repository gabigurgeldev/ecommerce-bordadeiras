import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function loadSession(sessionId = "default") {
  return prisma.whatsappSession.findUnique({ where: { sessionId } });
}

export async function saveSession(
  sessionId: string,
  data: {
    creds?: object | null;
    keys?: object | null;
    status: string;
    qrCode?: string | null;
  }
) {
  return prisma.whatsappSession.upsert({
    where: { sessionId },
    create: { sessionId, ...data },
    update: data,
  });
}

export async function clearSession(sessionId = "default") {
  return prisma.whatsappSession.upsert({
    where: { sessionId },
    create: {
      sessionId,
      status: "disconnected",
      creds: null,
      keys: null,
      qrCode: null,
    },
    update: {
      status: "disconnected",
      creds: null,
      keys: null,
      qrCode: null,
    },
  });
}

export async function getActiveRecipients() {
  return prisma.whatsappRecipient.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
}
