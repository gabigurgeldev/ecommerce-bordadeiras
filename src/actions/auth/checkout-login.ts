"use server";

import { authenticateUser } from "@/lib/authenticate-user";

export type CheckoutLoginResult =
  | { ok: true; redirect: string }
  | { ok: false; message: string };

export async function checkoutLoginAction(
  email: string,
  password: string,
): Promise<CheckoutLoginResult> {
  const authResult = await authenticateUser(email, password);
  if (!authResult.ok) {
    return { ok: false, message: authResult.message };
  }

  return { ok: true, redirect: "/checkout/endereco" };
}
