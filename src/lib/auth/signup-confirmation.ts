import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { findAuthUserByEmail } from "@/lib/auth/find-auth-user";
import { MailNotConfiguredError, sendVerificationEmail } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMailSettings, isMailConfigured } from "@/lib/settings";

export type SignupConfirmationResult =
  | { ok: true; authUser: SupabaseAuthUser; otpSent: boolean }
  | { ok: false; code: "exists" | "configuration" | "validation"; message: string };

function extractOtp(data: {
  properties?: { email_otp?: string };
  email_otp?: string;
}): string | null {
  const otp = data.properties?.email_otp ?? data.email_otp;
  return typeof otp === "string" && /^\d{6}$/.test(otp) ? otp : null;
}

/**
 * Cria (ou reutiliza) usuário no Supabase Auth e obtém OTP oficial via Admin API.
 * O mailer do GoTrue na VPS pode estar quebrado; neste caso enviamos o OTP da app
 * (mesmo código válido em verifyOtp no Supabase).
 */
export async function createSignupConfirmation(
  email: string,
  password: string,
  name: string,
): Promise<SignupConfirmationResult> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      code: "configuration",
      message: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectTo = `${appUrl}/auth/callback?next=/conta`;

  let link = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo },
  });

  if (link.error) {
    const lower = link.error.message.toLowerCase();
    if (lower.includes("already") || lower.includes("registered")) {
      const existing = await findAuthUserByEmail(admin, email);
      if (existing?.email_confirmed_at) {
        return { ok: false, code: "exists", message: "Este e-mail já está cadastrado." };
      }
      link = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
    }
  }

  if (link.error || !link.data?.user) {
    console.error("[signup-confirmation] generateLink", link.error?.message);
    return {
      ok: false,
      code: "validation",
      message: link.error?.message ?? "Não foi possível iniciar a confirmação de e-mail.",
    };
  }

  const otp = extractOtp(link.data);
  if (!otp) {
    return {
      ok: false,
      code: "validation",
      message: "Supabase não retornou o código OTP. Confira a configuração do Auth na VPS.",
    };
  }

  let otpSent = false;
  try {
    const cfg = await getMailSettings();
    if (!isMailConfigured(cfg)) {
      return {
        ok: false,
        code: "configuration",
        message:
          "SMTP da aplicação não configurado (SMTP_* no .env). Necessário para enviar o código enquanto o SMTP do Supabase Auth na VPS não funciona.",
      };
    }
    await sendVerificationEmail({ to: email, name, code: otp });
    otpSent = true;
  } catch (err) {
    if (err instanceof MailNotConfiguredError) {
      return { ok: false, code: "configuration", message: err.message };
    }
    console.error("[signup-confirmation] send mail", err);
    return {
      ok: false,
      code: "configuration",
      message:
        "Conta criada no Supabase, mas falha ao enviar o e-mail com o código. Corrija SMTP_* no .env ou o SMTP do Auth (Stalwart) na VPS.",
    };
  }

  return { ok: true, authUser: link.data.user, otpSent };
}

/** Reenvia OTP oficial (magiclink) para e-mail ainda não confirmado. */
export async function resendSignupConfirmation(
  email: string,
  name: string,
): Promise<{ ok: boolean; message?: string }> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.",
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (supabaseUrl && anonKey) {
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await anon.auth.resend({ type: "signup", email });
    if (!error) return { ok: true };
    console.warn("[resend] supabase resend failed, using generateLink fallback", error.message);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${appUrl}/auth/callback?next=/conta` },
  });

  if (error) {
    console.error("[resend] generateLink", error.message);
    return {
      ok: false,
      message:
        "Não foi possível gerar novo código. Verifique o SMTP do Supabase Auth (Stalwart) na VPS.",
    };
  }

  const otp = extractOtp(data);
  if (!otp) {
    return { ok: false, message: "Supabase não retornou o código OTP." };
  }

  try {
    await sendVerificationEmail({ to: email, name, code: otp });
    return { ok: true };
  } catch (err) {
    console.error("[resend] send mail", err);
    return {
      ok: false,
      message:
        "Código gerado, mas o e-mail não foi enviado. Configure SMTP_* no .env ou corrija o SMTP do Auth na VPS.",
    };
  }
}
