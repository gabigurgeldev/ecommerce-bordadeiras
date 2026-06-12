"use client";

import {
  updateNotificationPrefs,
  type NotificationPrefs,
} from "@/actions/account/notifications";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Package, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const prefItems = [
  {
    key: "orderUpdates" as const,
    icon: Package,
    title: "Atualizações de pedidos",
    description: "Status, envio e entrega",
  },
  {
    key: "promotions" as const,
    icon: Tag,
    title: "Promoções e novidades",
    description: "Ofertas e lançamentos",
  },
  {
    key: "email" as const,
    icon: Mail,
    title: "Notificações por e-mail",
    description: "Receber avisos no e-mail cadastrado",
  },
];

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
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      {prefItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className="account-card flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)]">
                <Icon className="h-4 w-4 text-[var(--color-brown)]" />
              </span>
              <span className="text-sm">
                <span className="font-medium text-[var(--color-brown)]">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-[var(--muted-foreground)]">
                  {item.description}
                </span>
              </span>
            </div>
            <Switch
              checked={prefs[item.key]}
              onCheckedChange={(checked) =>
                setPrefs((p) => ({ ...p, [item.key]: checked }))
              }
              aria-label={item.title}
            />
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando…" : "Salvar preferências"}
        </Button>
        <Bell className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden />
      </div>
    </form>
  );
}
