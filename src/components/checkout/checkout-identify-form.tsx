"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function CheckoutIdentifyForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
      callbackUrl: "/checkout/endereco",
    });
    setLoading(false);
    if (res?.error) {
      setError("E-mail ou senha inválidos");
      return;
    }
    window.location.href = "/checkout/endereco";
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-xs text-zinc-500" htmlFor="checkout-email">
            E-mail
          </label>
          <Input
            id="checkout-email"
            type="email"
            name="email"
            placeholder="voce@email.com"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500" htmlFor="checkout-password">
            Senha
          </label>
          <Input
            id="checkout-password"
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">ou continue sem cadastro</p>
      <Button className="mt-4 w-full" variant="outline" asChild>
        <Link href="/checkout/endereco">Continuar como visitante</Link>
      </Button>
    </>
  );
}
