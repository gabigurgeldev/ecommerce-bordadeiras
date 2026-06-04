import { resendSignupConfirmation } from "@/lib/auth/signup-confirmation";
import { upsertUserFromAuthUser } from "@/lib/auth/sync-user";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isDatabaseAvailable,
} from "@/lib/data/db-available";
import { findUserByEmail, getDb, TABLES } from "@/lib/supabase/db";
import { createClient } from "@/lib/supabase/server";
import { sanitizeEmail } from "@/lib/sanitize";

export type VerifyEmailResult =
  | { ok: true }
  | { ok: false; code: "invalid" | "expired" | "already" | "unavailable"; message: string };

function mapSupabaseOtpError(message: string): {
  code: "invalid" | "expired" | "already";
  message: string;
} {
  const lower = message.toLowerCase();
  if (lower.includes("expired") || lower.includes("expir")) {
    return { code: "expired", message: "Código expirado. Solicite um novo código abaixo." };
  }
  if (lower.includes("already") || lower.includes("confirmed")) {
    return { code: "already", message: "Este e-mail já foi verificado. Faça login." };
  }
  return { code: "invalid", message: "Código incorreto ou inválido. Verifique e tente novamente." };
}

function mapSupabaseResendError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("confirmation email") || lower.includes("sending email") || lower.includes("smtp")) {
    return (
      "O Supabase Auth não conseguiu enviar o e-mail. Verifique o SMTP (Stalwart) nas configurações do Auth na VPS."
    );
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }
  return "Não foi possível reenviar o código. Tente novamente em instantes.";
}

export async function verifyEmailCode(email: string, code: string): Promise<VerifyEmailResult> {
  const identifier = sanitizeEmail(email);
  const token = code.trim();

  if (!(await isDatabaseAvailable())) {
    return { ok: false, code: "unavailable", message: DATABASE_UNAVAILABLE_MESSAGE };
  }

  if (!/^\d{6}$/.test(token)) {
    return { ok: false, code: "invalid", message: "Código inválido. Use os 6 dígitos enviados por e-mail." };
  }

  const appUser = await findUserByEmail(identifier);
  if (!appUser) {
    return { ok: false, code: "invalid", message: "E-mail não encontrado." };
  }
  if (appUser.emailVerified) {
    return { ok: false, code: "already", message: "Este e-mail já foi verificado. Faça login." };
  }

  const supabase = await createClient();
  const otpTypes = ["signup", "email", "magiclink"] as const;
  let verify = await supabase.auth.verifyOtp({
    email: identifier,
    token,
    type: otpTypes[0],
  });

  for (let i = 1; verify.error && i < otpTypes.length; i += 1) {
    verify = await supabase.auth.verifyOtp({
      email: identifier,
      token,
      type: otpTypes[i],
    });
  }

  if (verify.error) {
    console.error("[verify-email] supabase verifyOtp", verify.error.message);
    const mapped = mapSupabaseOtpError(verify.error.message);
    return { ok: false, code: mapped.code, message: mapped.message };
  }

  const authUser = verify.data.user;
  if (authUser) {
    await upsertUserFromAuthUser(authUser);
  } else {
    await getDb()
      .from(TABLES.User)
      .update({ emailVerified: new Date().toISOString() })
      .eq("id", appUser.id);
  }

  return { ok: true };
}

export async function resendEmailVerificationCode(
  email: string,
): Promise<{ ok: boolean; message?: string }> {
  const identifier = sanitizeEmail(email);

  if (!(await isDatabaseAvailable())) {
    return { ok: false, message: DATABASE_UNAVAILABLE_MESSAGE };
  }

  const appUser = await findUserByEmail(identifier);
  if (!appUser || appUser.emailVerified) return { ok: true };

  const name = appUser.name != null ? String(appUser.name) : identifier;
  const result = await resendSignupConfirmation(identifier, name);
  if (!result.ok) {
    return { ok: false, message: result.message ?? mapSupabaseResendError("") };
  }

  return { ok: true };
}
