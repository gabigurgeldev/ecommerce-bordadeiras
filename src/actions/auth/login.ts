"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { authenticateUser, resolveLoginRedirect } from "@/lib/authenticate-user";

export type LoginAdminResult =
  | { ok: true }
  | { ok: false; code: "credentials" | "configuration" | "unverified" | "unknown"; message: string; email?: string };

export async function loginAdminAction(
  email: string,
  password: string,
  callbackUrl = "/",
): Promise<LoginAdminResult> {
  const authResult = await authenticateUser(email, password);
  if (!authResult.ok) {
    const code =
      authResult.reason === "unverified"
        ? "unverified"
        : authResult.reason === "unavailable" || authResult.reason === "configuration"
          ? "configuration"
          : "credentials";
    return {
      ok: false,
      code,
      message: authResult.message,
      email: authResult.reason === "unverified" ? authResult.email : undefined,
    };
  }

  const redirectTo = resolveLoginRedirect(callbackUrl, authResult.user);

  try {
    redirect(redirectTo);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      ok: false,
      code: "unknown",
      message: "Não foi possível concluir o login.",
    };
  }
}
