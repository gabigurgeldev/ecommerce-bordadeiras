import type { Role } from "@/lib/types/database";
import { auth as getAuthSession, type AppSessionUser } from "@/lib/auth/session";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
};

/** Supabase session + Prisma user when configured; otherwise null. */
export async function getSession() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) return null;
    const user = session.user as AppSessionUser;
    return {
      user: {
        id: user.id ?? "",
        email: user.email,
        name: user.name,
        role: user.role ?? "USER",
      },
    };
  } catch {
    return null;
  }
}
