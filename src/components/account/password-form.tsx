"use client";

import { changePassword } from "@/actions/account/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function PasswordForm() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const result = await changePassword({
      newPassword: String(form.get("new") ?? ""),
      confirmPassword: String(form.get("confirm") ?? ""),
    });
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Senha atualizada");
    e.currentTarget.reset();
  }

  return (
    <div className="account-card max-w-md">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--secondary)]">
          <Lock className="h-4 w-4 text-[var(--color-brown)]" />
        </span>
        <p className="text-sm text-[var(--muted-foreground)]">
          Use pelo menos 8 caracteres, combinando letras e números.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            className="label-caps mb-1.5 block"
            htmlFor="new-password"
          >
            Nova senha
          </label>
          <Input id="new-password" type="password" name="new" required minLength={8} />
        </div>
        <div>
          <label
            className="label-caps mb-1.5 block"
            htmlFor="confirm-password"
          >
            Confirmar nova senha
          </label>
          <Input
            id="confirm-password"
            type="password"
            name="confirm"
            required
            minLength={8}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Atualizando…" : "Atualizar senha"}
        </Button>
      </form>
    </div>
  );
}
