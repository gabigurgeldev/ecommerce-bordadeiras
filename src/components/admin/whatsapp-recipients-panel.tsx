"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { WhatsappRecipient } from "@prisma/client";
import { z } from "zod";
import { whatsappRecipientSchema } from "@/lib/validations/admin";
import {
  createWhatsappRecipient,
  deleteWhatsappRecipient,
  toggleWhatsappRecipient,
} from "@/actions/admin/whatsapp-recipients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FormValues = z.infer<typeof whatsappRecipientSchema>;

export function WhatsappRecipientsPanel({
  recipients: initial,
}: {
  recipients: WhatsappRecipient[];
}) {
  const router = useRouter();
  const [recipients] = useState(initial);
  const form = useForm<FormValues>({
    resolver: zodResolver(whatsappRecipientSchema),
    defaultValues: { label: "", phone: "", active: true },
  });

  function refresh() {
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Destinatários dos alertas</CardTitle>
        <CardDescription>
          Números que recebem avisos de pedido (não é o número emissor). Ex.: 5511999999999
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="grid gap-4 sm:grid-cols-3"
          onSubmit={form.handleSubmit(async (data) => {
            const res = await createWhatsappRecipient(data);
            if (res.success) {
              toast.success("Destinatário adicionado");
              form.reset({ label: "", phone: "", active: true });
              await refresh();
            } else toast.error(res.error);
          })}
        >
          <div className="space-y-2">
            <Label>Nome (opcional)</Label>
            <Input placeholder="Gerente" {...form.register("label")} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input placeholder="5511999999999" {...form.register("phone")} />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full sm:w-auto">
              Adicionar
            </Button>
          </div>
        </form>

        <ul className="divide-y rounded-lg border">
          {recipients.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">Nenhum destinatário cadastrado.</li>
          ) : (
            recipients.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-medium">{r.label || "Sem nome"}</p>
                  <p className="text-sm text-muted-foreground">{r.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.active ? "default" : "secondary"}>
                    {r.active ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const res = await toggleWhatsappRecipient(r.id, !r.active);
                      if (res.success) await refresh();
                      else toast.error(res.error);
                    }}
                  >
                    {r.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      if (!confirm("Remover destinatário?")) return;
                      const res = await deleteWhatsappRecipient(r.id);
                      if (res.success) await refresh();
                      else toast.error(res.error);
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
