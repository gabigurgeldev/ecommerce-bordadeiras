import { NextResponse } from "next/server";
import { readAdminEnv } from "@/lib/admin-bootstrap";
import { prisma } from "@/lib/prisma";

/** Diagnóstico rápido de deploy (sem expor senhas). */
export async function GET() {
  const adminEnv = readAdminEnv();
  let adminInDb = false;

  try {
    const user = await prisma.user.findUnique({
      where: { email: adminEnv.email },
      select: { id: true, role: true, passwordHash: true },
    });
    adminInDb = Boolean(user?.passwordHash);
  } catch {
    adminInDb = false;
  }

  return NextResponse.json({
    authSecretSet: Boolean(process.env.AUTH_SECRET?.trim()),
    authUrl: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? null,
    databaseUrlSet: Boolean(process.env.DATABASE_URL?.trim()),
    adminEmailConfigured: adminEnv.email,
    adminInDatabase: adminInDb,
    runDbSeed: process.env.RUN_DB_SEED ?? "true",
  });
}
