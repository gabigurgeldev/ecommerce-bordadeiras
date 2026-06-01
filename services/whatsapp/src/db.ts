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
