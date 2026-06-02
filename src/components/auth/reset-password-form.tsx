"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(128),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!token || token.length < 32) {
      setServerError("Link inválido ou expirado. Solicite uma nova recuperação de senha.");
      return;
    }

    setServerError(null);
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          token,
          password: values.password,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        return;
      }

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.status === 429) {
        setServerError("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        setServerError(data?.error ?? "Link inválido ou expirado.");
      }
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    }
  }

  if (!token) {
    return (
      <AuthShell title="Link inválido" subtitle="Solicite uma nova recuperação">
        <p className="text-center text-sm text-[var(--foreground)]/80">
          Este link de redefinição de senha não é válido. Peça um novo e-mail em
          &quot;Esqueci minha senha&quot;.
        </p>
        <Button className="mt-6 w-full" asChild>
          <Link href="/esqueci-senha">Solicitar novo link</Link>
        </Button>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell title="Senha atualizada!" subtitle="Use sua nova senha para entrar">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-green)]/15 text-[var(--color-green)]">
            <Check className="h-8 w-8" />
          </span>
          <p className="mt-5 text-sm text-[var(--foreground)]/80">
            Sua senha foi redefinida com sucesso.
          </p>
          <Button className="mt-7 w-full" onClick={() => router.push("/login")}>
            Ir para o login
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nova senha" subtitle="Escolha uma senha segura">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
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
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-[var(--destructive)]">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirmar nova senha</Label>
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
            <p className="text-xs text-[var(--destructive)]">{errors.confirm.message}</p>
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
              Salvando…
            </>
          ) : (
            "Redefinir senha"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
