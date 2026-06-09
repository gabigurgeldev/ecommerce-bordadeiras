"use client";

import { changePassword } from "@/actions/account/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-4">
      <div>
        <label className="text-xs text-zinc-500" htmlFor="new-password">
          Nova senha
        </label>
        <Input id="new-password" type="password" name="new" required minLength={8} />
      </div>
      <div>
        <label className="text-xs text-zinc-500" htmlFor="confirm-password">
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
  );
}
