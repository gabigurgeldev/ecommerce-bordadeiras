import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/** Credenciais de bootstrap definidas no painel (EasyPanel) — usadas no seed e no login. */
export function readAdminEnv() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!email || !password) return null;
  return { email, password };
}

export function credentialsMatchAdminEnv(email: string, password: string) {
  const admin = readAdminEnv();
  if (!admin) return false;
  return email.trim().toLowerCase() === admin.email && password === admin.password;
}

/** Garante usuário ADMIN com hash alinhado ao env (idempotente). */
export async function ensureAdminUser(email: string, plainPassword: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  return prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name: "Administrador",
      role: Role.ADMIN,
      passwordHash,
    },
    create: {
      email: normalizedEmail,
      name: "Administrador",
      role: Role.ADMIN,
      passwordHash,
      emailVerified: new Date(),
    },
  });
}
