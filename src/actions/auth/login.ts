"use server";

import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";
import { authenticateUser, resolveLoginRedirect } from "@/lib/authenticate-user";

export type LoginAdminResult =
  | { ok: true }
  | { ok: false; code: "credentials" | "configuration" | "unverified" | "unknown"; message: string; email?: string };

export async function loginAdminAction(
  email: string,
  password: string,
  callbackUrl = "/",
): Promise<LoginAdminResult> {
  if (!process.env.AUTH_SECRET?.trim()) {
    return {
      ok: false,
      code: "configuration",
      message: "AUTH_SECRET não está configurado no servidor.",
    };
  }

  const authResult = await authenticateUser(email, password);
  if (!authResult.ok) {
    const code =
      authResult.reason === "unverified"
        ? "unverified"
        : authResult.reason === "unavailable"
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
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
    return { ok: true };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          ok: false,
          code: "credentials",
          message: "E-mail ou senha incorretos.",
        };
      }
      return {
        ok: false,
        code: "configuration",
        message: `Erro de autenticação (${error.type}). Verifique AUTH_SECRET e AUTH_URL.`,
      };
    }
    throw error;
  }
}
