import bcrypt from "bcryptjs";
import { credentialsMatchAdminEnv, ensureAdminUser } from "@/lib/admin-bootstrap";
import { isDatabaseAvailable } from "@/lib/data/db-available";
import { prisma } from "@/lib/prisma";

async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const exact = await prisma.user.findUnique({ where: { email: normalized } });
  if (exact) return exact;

  const trimmed = email.trim();
  if (trimmed !== normalized) {
    return prisma.user.findUnique({ where: { email: trimmed } });
  }

  return null;
}

/** Valida e-mail/senha; sincroniza admin a partir do env quando necessário. */
export async function verifyUserCredentials(email: string, password: string) {
  if (!email || !password) return null;
  if (!(await isDatabaseAvailable())) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(email);

  if (user?.passwordHash) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (valid) return user;
    const validTrimmed = password !== password.trim()
      ? await bcrypt.compare(password.trim(), user.passwordHash)
      : false;
    if (validTrimmed) return user;
  }

  if (credentialsMatchAdminEnv(normalizedEmail, password)) {
    return ensureAdminUser(normalizedEmail, password.trim() || password);
  }

  const trimmed = password.trim();
  if (trimmed !== password && credentialsMatchAdminEnv(normalizedEmail, trimmed)) {
    return ensureAdminUser(normalizedEmail, trimmed);
  }

  return null;
}
