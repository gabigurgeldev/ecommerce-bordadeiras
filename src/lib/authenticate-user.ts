import { Role, type User } from "@prisma/client";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isDatabaseAvailable,
} from "@/lib/data/db-available";
import { verifyUserCredentials } from "@/lib/verify-credentials";

function isAdminEmail(email: string) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return false;
  return email.trim().toLowerCase() === adminEmail;
}

export function isAdminUser(user: { email: string; role: Role }) {
  return user.role === Role.ADMIN || isAdminEmail(user.email);
}

export type AuthenticateResult =
  | { ok: true; user: User }
  | { ok: false; reason: "invalid"; message: string }
  | { ok: false; reason: "unverified"; email: string; message: string }
  | { ok: false; reason: "unavailable"; message: string };

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthenticateResult> {
  if (!(await isDatabaseAvailable())) {
    return {
      ok: false,
      reason: "unavailable",
      message: DATABASE_UNAVAILABLE_MESSAGE,
    };
  }

  const user = await verifyUserCredentials(email, password);
  if (!user) {
    return {
      ok: false,
      reason: "invalid",
      message: "E-mail ou senha incorretos.",
    };
  }

  if (!user.emailVerified && !isAdminUser(user)) {
    return {
      ok: false,
      reason: "unverified",
      email: user.email,
      message:
        "E-mail não verificado. Confira todas as caixas de entrada (incluindo SPAM) e informe o código de verificação.",
    };
  }

  return { ok: true, user };
}

export function resolveLoginRedirect(
  callbackUrl: string,
  user: { email: string; role: Role },
): string {
  const safe =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";
  const isDefault = !safe || safe === "/";
  if (isAdminUser(user) && isDefault) return "/admin";
  return safe || "/";
}
