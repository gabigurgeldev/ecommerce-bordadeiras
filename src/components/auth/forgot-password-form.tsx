"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Loader2, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailSpamNotice } from "@/components/auth/email-spam-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        setSuccess(true);
        return;
      }

      if (res.status === 429) {
        setServerError("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        setServerError("Não foi possível enviar o e-mail. Tente novamente.");
      }
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    }
  }

  if (success) {
    return (
      <AuthShell title="Verifique seu e-mail" subtitle="Link de recuperação enviado">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-green)]/15 text-[var(--color-green)]">
            <MailCheck className="h-8 w-8" />
          </span>
          <p className="mt-5 text-sm text-[var(--foreground)]/80">
            Se existir uma conta com esse e-mail, enviamos um link para redefinir sua
            senha. O link expira em 1 hora.
          </p>
          <EmailSpamNotice className="mt-4 text-xs text-[var(--muted-foreground)]" />
          <Button className="mt-7 w-full" asChild>
            <Link href="/login">Voltar ao login</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Esqueci minha senha" subtitle="Enviaremos um link de recuperação">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail da conta</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              className="pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-[var(--destructive)]">{errors.email.message}</p>
          )}
        </div>

        <EmailSpamNotice className="rounded-xl bg-[var(--secondary)] px-3 py-2.5 text-xs text-[var(--muted-foreground)]" />

        {serverError && (
          <div className="flex items-start gap-2 rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 px-3 py-2.5 text-sm text-[var(--destructive)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : (
            "Enviar link de recuperação"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--color-cta)] transition hover:text-[var(--color-cta-hover)]"
        >
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
