import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";

export type AdminActor = {
  id: string;
  email: string;
  role: Role;
};

function isAdminEmail(email: string) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return false;
  return email.trim().toLowerCase() === adminEmail;
}

export async function getAdminActor(): Promise<AdminActor | null> {
  const session = await getSession();
  if (!session?.user?.email) return null;

  const role = session.user.role as Role;
  if (role === Role.ADMIN || isAdminEmail(session.user.email)) {
    return {
      id: session.user.id || "admin-stub",
      email: session.user.email,
      role: Role.ADMIN,
    };
  }
  return null;
}

export async function requireAdmin(): Promise<AdminActor> {
  const actor = await getAdminActor();
  if (!actor) redirect("/login?callbackUrl=/admin");
  return actor;
}
