"use server";

import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";

export type LoginAdminResult =
  | { ok: true }
  | { ok: false; code: "credentials" | "configuration" | "unknown"; message: string };

export async function loginAdminAction(
  email: string,
  password: string,
): Promise<LoginAdminResult> {
  if (!process.env.AUTH_SECRET?.trim()) {
    return {
      ok: false,
      code: "configuration",
      message: "AUTH_SECRET não está configurado no servidor.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { ok: true };
  } catch (error) {
    if (isRedirectError(error)) {
      return { ok: true };
    }
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          ok: false,
          code: "credentials",
          message: "Credenciais inválidas. Confira ADMIN_EMAIL/ADMIN_PASSWORD no EasyPanel ou rode o seed.",
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
