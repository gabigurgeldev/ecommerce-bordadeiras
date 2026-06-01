import type { Role } from "@prisma/client";
import { auth as nextAuth } from "@/auth";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
};

/** Auth.js session when configured; otherwise null. */
export async function getSession() {
  try {
    const session = await nextAuth();
    if (!session?.user?.email) return null;
    const user = session.user as SessionUser & { email: string };
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
