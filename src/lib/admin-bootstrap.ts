import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function stripEnvValue(value: string | undefined) {
  if (!value) return "";
  return value.trim().replace(/^["']|["']$/g, "");
}

/** Credenciais de bootstrap (EasyPanel) — mesmos defaults do seed. */
export function readAdminEnv() {
  const email = stripEnvValue(process.env.ADMIN_EMAIL).toLowerCase() || "admin@bordadeiras.com.br";
  const password = stripEnvValue(process.env.ADMIN_PASSWORD) || "Admin@123456";
  return { email, password };
}

export function credentialsMatchAdminEnv(email: string, password: string) {
  const admin = readAdminEnv();
  const normalized = email.trim().toLowerCase();
  if (normalized !== admin.email) return false;
  return password === admin.password || password.trim() === admin.password;
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
