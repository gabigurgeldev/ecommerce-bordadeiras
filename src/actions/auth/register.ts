"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";
import { registerUser, type RegisterUserResult } from "@/lib/register-user";

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

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeCallback,
    });
    return result;
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    throw error;
  }
}
