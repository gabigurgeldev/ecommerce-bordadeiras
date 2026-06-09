"use client";

import {
  updateNotificationPrefs,
  type NotificationPrefs,
} from "@/actions/account/notifications";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function NotificationsForm({
  initialPrefs,
}: {
  initialPrefs: NotificationPrefs;
}) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await updateNotificationPrefs(prefs);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Preferências salvas");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-4">
      <label className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-card-border)] p-4">
        <span className="text-sm">
          <span className="font-medium text-[var(--color-brown)]">
            Atualizações de pedidos
          </span>
          <span className="mt-0.5 block text-[var(--muted-foreground)]">
            Status, envio e entrega
          </span>
        </span>
        <input
          type="checkbox"
          checked={prefs.orderUpdates}
          onChange={(e) =>
            setPrefs((p) => ({ ...p, orderUpdates: e.target.checked }))
          }
          aria-label="Atualizações de pedidos"
        />
      </label>

      <label className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-card-border)] p-4">
        <span className="text-sm">
          <span className="font-medium text-[var(--color-brown)]">
            Promoções e novidades
          </span>
          <span className="mt-0.5 block text-[var(--muted-foreground)]">
            Ofertas e lançamentos
          </span>
        </span>
        <input
          type="checkbox"
          checked={prefs.promotions}
          onChange={(e) =>
            setPrefs((p) => ({ ...p, promotions: e.target.checked }))
          }
          aria-label="Promoções e novidades"
        />
      </label>

      <label className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-card-border)] p-4">
        <span className="text-sm">
          <span className="font-medium text-[var(--color-brown)]">
            Notificações por e-mail
          </span>
          <span className="mt-0.5 block text-[var(--muted-foreground)]">
            Receber avisos no e-mail cadastrado
          </span>
        </span>
        <input
          type="checkbox"
          checked={prefs.email}
          onChange={(e) =>
            setPrefs((p) => ({ ...p, email: e.target.checked }))
          }
          aria-label="Notificações por e-mail"
        />
      </label>

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando…" : "Salvar preferências"}
      </Button>
    </form>
  );
}
