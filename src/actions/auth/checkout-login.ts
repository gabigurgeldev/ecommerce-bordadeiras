"use server";

import { redirect } from "next/navigation";
import { authenticateUser } from "@/lib/authenticate-user";

export type CheckoutLoginResult =
  | { ok: true }
  | { ok: false; message: string };

export async function checkoutLoginAction(
  email: string,
  password: string,
): Promise<CheckoutLoginResult> {
  const authResult = await authenticateUser(email, password);
  if (!authResult.ok) {
    return { ok: false, message: authResult.message };
  }

  redirect("/checkout/endereco");
}
