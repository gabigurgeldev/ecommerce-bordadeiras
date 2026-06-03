import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/admin-access";

export type AdminActor = {
  id: string;
  email: string;
  role: Role;
};

export async function getAdminActor(): Promise<AdminActor | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.email || !hasAdminAccess(user)) return null;

  return {
    id: user.id || "",
    email: user.email,
    role: user.role ?? Role.USER,
  };
}

export async function requireAdmin(): Promise<AdminActor> {
  const actor = await getAdminActor();
  if (!actor) redirect("/login?callbackUrl=/admin");
  return actor;
}

/** Route Handlers — same checks as requireAdmin, without redirect. */
export async function requireAdminApi(): Promise<AdminActor | null> {
  return getAdminActor();
}
