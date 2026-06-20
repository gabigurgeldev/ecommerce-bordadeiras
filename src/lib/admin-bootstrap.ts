import bcrypt from "bcryptjs";
import { upsertUserByEmail } from "@/lib/supabase/db";
import { Role } from "@/lib/types/database";

function stripEnvValue(value: string | undefined) {
  if (!value) return "";
  return value.trim().replace(/^["']|["']$/g, "");
}

const isProduction = process.env.NODE_ENV === "production";

function isValidAdminEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  return ![
    "admin@bordadeiras.com.br",
    "admin@example.com",
    "admin@seudominio.com.br",
  ].includes(email);
}

function isWeakAdminPassword(password: string) {
  const normalized = password.toLowerCase();
  const commonPasswords = new Set([
    "admin@123456",
    "admin123456",
    "password",
    "minioadmin",
    "12345678",
  ]);

  return (
    password.length < 12 ||
    commonPasswords.has(normalized) ||
    normalized.includes("altere") ||
    normalized.includes("change") ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  );
}

function assertStrongProductionAdmin(email: string, password: string) {
  if (!isProduction) return;

  const issues: string[] = [];
  if (!email || !isValidAdminEmail(email)) issues.push("ADMIN_EMAIL");
  if (!password || isWeakAdminPassword(password)) issues.push("ADMIN_PASSWORD");

  if (issues.length > 0) {
    throw new Error(
      `Production admin bootstrap requires strong values for: ${issues.join(", ")}`
    );
  }
}

/** Credenciais de bootstrap (EasyPanel). Sem defaults previsiveis. */
export function readAdminEnv() {
  const email = stripEnvValue(process.env.ADMIN_EMAIL).toLowerCase();
  const password = stripEnvValue(process.env.ADMIN_PASSWORD);
  assertStrongProductionAdmin(email, password);
  return { email, password };
}

export function credentialsMatchAdminEnv(email: string, password: string) {
  const admin = readAdminEnv();
  if (!admin.email || !admin.password) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized !== admin.email) return false;
  return password === admin.password || password.trim() === admin.password;
}

/** Garante usuário ADMIN com hash alinhado ao env (idempotente). */
export async function ensureAdminUser(email: string, plainPassword: string) {
  const normalizedEmail = email.trim().toLowerCase();
  assertStrongProductionAdmin(normalizedEmail, plainPassword);
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
