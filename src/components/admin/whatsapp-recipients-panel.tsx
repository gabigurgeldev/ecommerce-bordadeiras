"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import type { WhatsappRecipient } from "@/lib/types/database";
import { z } from "zod";
import { whatsappRecipientSchema } from "@/lib/validations/admin";
import {
  createWhatsappRecipient,
  deleteWhatsappRecipient,
  toggleWhatsappRecipient,
} from "@/actions/admin/whatsapp-recipients";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FormValues = z.infer<typeof whatsappRecipientSchema>;

export function WhatsappRecipientsPanel({
  recipients: initial,
}: {
  recipients: WhatsappRecipient[];
}) {
  const router = useRouter();
  const [recipients] = useState(initial);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(whatsappRecipientSchema),
    defaultValues: { label: "", phone: "", active: true },
  });

  function refresh() {
    router.refresh();
  }

  return (
    <>
      <Card className="h-full shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Destinatários dos alertas</CardTitle>
          <CardDescription>
            Números que recebem avisos de pedido (não é o número emissor). Ex.: 5511999999999
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            className="rounded-lg border bg-muted/20 p-4"
            onSubmit={form.handleSubmit(async (data) => {
              const res = await createWhatsappRecipient(data);
              if (res.success) {
                toast.success("Destinatário adicionado");
                form.reset({ label: "", phone: "", active: true });
                refresh();
              } else toast.error(res.error);
            })}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome (opcional)</Label>
                <Input placeholder="Gerente" {...form.register("label")} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input placeholder="5511999999999" {...form.register("phone")} />
              </div>
            </div>
            <div className="mt-4">
              <Button type="submit" className="w-full sm:w-auto">
                Adicionar
              </Button>
            </div>
          </form>

          {recipients.length === 0 ? (
            <AdminEmptyState
              icon={Phone}
              title="Nenhum destinatário"
              description="Adicione números que receberão alertas de novos pedidos."
              className="py-8"
            />
          ) : (
            <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
              <Table className="min-w-[400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell>
                        <p className="font-medium">{r.label || "Sem nome"}</p>
                        <p className="font-mono text-sm text-muted-foreground">{r.phone}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.active ? "default" : "secondary"}>
                          {r.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const res = await toggleWhatsappRecipient(r.id, !r.active);
                              if (res.success) refresh();
                              else toast.error(res.error);
                            }}
                          >
                            {r.active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteId(r.id)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AdminConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover destinatário?"
        description="Este número deixará de receber alertas de pedidos."
        confirmLabel="Remover"
        destructive
        onConfirm={async () => {
          if (!deleteId) return;
          const res = await deleteWhatsappRecipient(deleteId);
          if (res.success) {
            toast.success("Destinatário removido");
            setDeleteId(null);
            refresh();
          } else toast.error(res.error);
        }}
      />
    </>
  );
}
