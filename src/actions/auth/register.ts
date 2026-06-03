"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { registerUser, type RegisterUserResult } from "@/lib/register-user";
import { authenticateUser } from "@/lib/authenticate-user";

export type RegisterActionResult = RegisterUserResult;

export async function registerAction(
  name: string,
  email: string,
  password: string,
  callbackUrl = "/conta",
): Promise<RegisterActionResult> {
  const result = await registerUser({ name, email, password });
  if (!result.ok) return result;

  const safeCallback =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/conta";

  const login = await authenticateUser(email, password);
  if (login.ok) {
    try {
      redirect(safeCallback);
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
    }
  }

  return result;
}
