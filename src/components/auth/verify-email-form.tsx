"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Loader2, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  code: z
    .string()
    .length(6, "Informe os 6 dígitos")
    .regex(/^\d{6}$/, "Use apenas números"),
});

type FormValues = z.infer<typeof schema>;

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: searchParams.get("email") ?? "",
      code: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

      const res = await fetch("/api/auth/verify-email", {
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

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.status === 429) {
        setServerError("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        setServerError(data?.error ?? "Não foi possível verificar o código.");
      }
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    }
  }

  async function onResend() {
    const email = getValues("email");
    if (!email) {
      setResendMessage("Informe seu e-mail antes de reenviar.");
      return;
    }

    setResending(true);
    setResendMessage(null);
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setResendMessage("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        setResendMessage("Se o e-mail estiver pendente, enviamos um novo código.");
      }
    } catch {
      setResendMessage("Erro ao reenviar. Tente novamente.");
    } finally {
      setResending(false);
    }
  }

  if (success) {
    return (
      <AuthShell title="E-mail verificado!" subtitle="Sua conta está pronta">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-green)]/15 text-[var(--color-green)]">
            <Check className="h-8 w-8" />
          </span>
          <p className="mt-5 text-sm text-[var(--foreground)]/80">
            Agora você pode entrar na sua conta.
          </p>
          <Button
            className="mt-7 w-full"
            onClick={() =>
              router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
            }
          >
            Ir para o login
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Verificar e-mail" subtitle="Informe o código de 6 dígitos">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
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

        <div className="space-y-1.5">
          <Label htmlFor="code">Código de verificação</Label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              className="pl-10 tracking-[0.3em]"
              {...register("code")}
            />
          </div>
          {errors.code && (
            <p className="text-xs text-[var(--destructive)]">{errors.code.message}</p>
          )}
        </div>

        <EmailSpamNotice className="rounded-xl bg-[var(--secondary)] px-3 py-2.5 text-xs text-[var(--muted-foreground)]" />

        {serverError && (
          <div className="flex items-start gap-2 rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 px-3 py-2.5 text-sm text-[var(--destructive)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {resendMessage && (
          <p className="text-center text-xs text-[var(--muted-foreground)]">{resendMessage}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando…
            </>
          ) : (
            "Confirmar código"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={resending}
          onClick={onResend}
        >
          {resending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Reenviando…
            </>
          ) : (
            "Reenviar código"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Já verificou?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-[var(--color-cta)] transition hover:text-[var(--color-cta-hover)]"
        >
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
