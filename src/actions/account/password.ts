"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function changePassword(
  input: z.infer<typeof passwordSchema>,
): Promise<ChangePasswordResult> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
