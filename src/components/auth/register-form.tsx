"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailSpamNotice } from "@/components/auth/email-spam-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    name: z.string().min(2, "Informe seu nome completo").max(120),
    email: z.string().email("E-mail inválido"),
    password: z
      .string()
      .min(8, "A senha deve ter ao menos 8 caracteres")
      .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula")
      .regex(/[0-9]/, "Inclua ao menos um número"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

const requirements = [
  { label: "Mínimo de 8 caracteres", test: (v: string) => v.length >= 8 },
  { label: "Uma letra maiúscula", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Um número", test: (v: string) => /[0-9]/.test(v) },
  { label: "Um símbolo (recomendado)", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function strengthLabel(score: number) {
  if (score <= 1) return { label: "Fraca", color: "#dc2626", width: "33%" };
  if (score === 2) return { label: "Média", color: "#d9a441", width: "66%" };
  return { label: "Forte", color: "#6f9d4c", width: "100%" };
}

export function RegisterForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });

  const password = watch("password") ?? "";
  const metRequirements = requirements.filter((r) => r.test(password)).length;
  const strength = strengthLabel(metRequirements);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      if (res.ok) {
        setRegisteredEmail(values.email);
        setSuccess(true);
        return;
      }

      if (res.status === 409) {
        setServerError("Este e-mail já está cadastrado.");
      } else if (res.status === 429) {
        setServerError("Muitas tentativas. Tente novamente em instantes.");
      } else {
        setServerError("Não foi possível concluir o cadastro. Tente novamente.");
      }
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    }
  }

  if (success) {
    return (
      <AuthShell
        title="Cadastro realizado!"
        subtitle="Falta só um passo para começar"
      >
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-green)]/15 text-[var(--color-green)]">
            <MailCheck className="h-8 w-8" />
          </span>
          <p className="mt-5 text-sm text-[var(--foreground)]/80">
            Enviamos um código de 6 dígitos para confirmar seu cadastro. Verifique
            todas as caixas de entrada — incluindo SPAM, Lixo eletrônico e Promoções.
          </p>
          <EmailSpamNotice className="mt-4 text-xs text-[var(--muted-foreground)]" />
          <Button className="mt-7 w-full" asChild>
            <Link
              href={`/verificar-email?email=${encodeURIComponent(registeredEmail)}&callbackUrl=${encodeURIComponent(callbackUrl)}`}
            >
              Informar código de verificação
            </Link>
          </Button>
          <Button variant="outline" className="mt-3 w-full" asChild>
            <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
              Ir para o login
            </Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Cadastre-se para acompanhar seus pedidos"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              id="name"
              autoComplete="name"
              placeholder="Seu nome"
              className="pl-10"
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-[var(--destructive)]">
              {errors.name.message}
            </p>
          )}
        </div>

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
            <p className="text-xs text-[var(--destructive)]">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className="px-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:text-[var(--color-brown)]"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {password.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--secondary)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: strength.width, backgroundColor: strength.color }}
                  />
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: strength.color }}
                >
                  {strength.label}
                </span>
              </div>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {requirements.map((req) => {
                  const ok = req.test(password);
                  return (
                    <li
                      key={req.label}
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        ok
                          ? "text-[var(--color-green)]"
                          : "text-[var(--muted-foreground)]",
                      )}
                    >
                      {ok ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      {req.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {errors.password && (
            <p className="text-xs text-[var(--destructive)]">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className="pl-10"
              {...register("confirm")}
            />
          </div>
          {errors.confirm && (
            <p className="text-xs text-[var(--destructive)]">
              {errors.confirm.message}
            </p>
          )}
        </div>

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
              Cadastrando…
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Já tem conta?{" "}
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
