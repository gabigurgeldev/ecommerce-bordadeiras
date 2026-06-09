"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSession } from "@/components/providers/session-provider";
import Link from "next/link";
import { checkoutLoginAction } from "@/actions/auth/checkout-login";

export function CheckoutIdentifyForm() {
  const router = useRouter();
  const { refresh } = useAppSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const result = await checkoutLoginAction(email, password);
    if (!result.ok) {
      setError(result.message);
      setLoading(false);
      return;
    }

    await refresh();
    router.push(result.redirect);
    router.refresh();
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
