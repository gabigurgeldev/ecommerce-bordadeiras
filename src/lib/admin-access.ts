import { Role } from "@prisma/client";

export function isProductionAdminStrict(): boolean {
  return process.env.NODE_ENV === "production";
}

function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || !email) return false;
  return email.trim().toLowerCase() === adminEmail;
}

/** Whether the session user may access /admin routes and admin APIs. */
export function hasAdminAccess(user: {
  email?: string | null;
  role?: Role | string | null;
} | undefined): boolean {
  if (!user?.email) return false;

  const role = user.role as Role | undefined;
  if (role === Role.ADMIN) return true;

  // Em produção exige role ADMIN no JWT (definido no login a partir do banco).
  if (isProductionAdminStrict()) return false;

  return isAdminEmail(user.email);
}
