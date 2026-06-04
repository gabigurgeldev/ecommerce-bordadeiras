import bcrypt from "bcryptjs";
import { upsertUserByEmail } from "@/lib/supabase/db";
import { Role } from "@/lib/types/database";

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

  const user = await upsertUserByEmail(normalizedEmail, {
    name: "Administrador",
    role: Role.ADMIN,
    passwordHash,
    emailVerified: new Date(),
  });
  if (!user) throw new Error("Failed to ensure admin user");
  return user;
}
