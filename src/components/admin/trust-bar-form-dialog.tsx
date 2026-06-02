"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { StorefrontTrustItem } from "@prisma/client";
import type { z } from "zod";
import { upsertTrustBarItem } from "@/actions/admin/trust-bar";
import { trustBarItemSchema } from "@/lib/validations/admin";
import {
  TRUST_ICON_KEYS,
  TRUST_ICON_LABELS,
  getTrustIcon,
  type TrustIconKey,
} from "@/lib/trust-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormValues = z.infer<typeof trustBarItemSchema>;

function IconPreview({ iconKey }: { iconKey: TrustIconKey }) {
  const Icon = getTrustIcon(iconKey);
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
      <Icon className="h-5 w-5 text-foreground" strokeWidth={2.25} aria-hidden />
    </span>
  );
}

export function TrustBarFormDialog({ item }: { item?: StorefrontTrustItem }) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(trustBarItemSchema),
    defaultValues: {
      title: item?.title ?? "",
      description: item?.description ?? "",
      icon: (item?.icon as TrustIconKey) ?? "badge-check",
      link: item?.link ?? "",
      sortOrder: item?.sortOrder ?? 0,
      active: item?.active ?? true,
    },
  });

  const iconKey = form.watch("icon") as TrustIconKey;

  if (!open && !item) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Novo item
      </Button>
    );
  }

  const onSubmit = form.handleSubmit(async (data) => {
    const res = await upsertTrustBarItem(data, item?.id);
    if (res.success) {
      toast.success(item ? "Item atualizado" : "Item criado");
      setOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error);
    }
  });

  return (
    <div className={item ? "inline-block" : "rounded-lg border p-4"}>
      {item ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Editar
        </Button>
      ) : null}

      {open && (
        <form
          onSubmit={onSubmit}
          className={item ? "mt-4 space-y-3 rounded-lg border p-4" : "space-y-3"}
        >
          <div className="space-y-1">
            <Label>Título</Label>
            <Input {...form.register("title")} placeholder="Ex.: Pagamento Seguro" />
          </div>

          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input
              {...form.register("description")}
              placeholder="Ex.: Ambiente protegido e criptografado"
            />
          </div>

          <div className="space-y-1">
            <Label>Ícone</Label>
            <div className="flex items-center gap-3">
              <IconPreview iconKey={iconKey} />
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                {...form.register("icon")}
              >
                {TRUST_ICON_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {TRUST_ICON_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Link (opcional)</Label>
            <Input {...form.register("link")} placeholder="https://... ou /contato" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Ordem</Label>
              <Input
                type="number"
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" {...form.register("active")} />
              Ativo na vitrine
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm">
              Salvar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              {item ? "Fechar" : "Cancelar"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
