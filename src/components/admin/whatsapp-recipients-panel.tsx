"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Phone, Send } from "lucide-react";
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
  recipients,
  whatsappConnected: initialConnected = false,
}: {
  recipients: WhatsappRecipient[];
  whatsappConnected?: boolean;
}) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(initialConnected);
  const activeCount = recipients.filter((r) => r.active).length;

  const fetchConnectionStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/health", { cache: "no-store" });
      if (!res.ok) {
        setWhatsappConnected(false);
        return;
      }
      const data = (await res.json()) as { connected?: boolean };
      setWhatsappConnected(data.connected === true);
    } catch {
      setWhatsappConnected(false);
    }
  }, []);

  useEffect(() => {
    void fetchConnectionStatus();
    const interval = setInterval(() => {
      void fetchConnectionStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchConnectionStatus]);

  const form = useForm<FormValues>({
    resolver: zodResolver(whatsappRecipientSchema),
    defaultValues: { label: "", phone: "", active: true },
  });

  function refresh() {
    router.refresh();
  }

  async function handleTestAlert() {
    setTesting(true);
    try {
      const res = await fetch("/api/admin/whatsapp/send-test-admin", {
        method: "POST",
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        recipientsSent?: number;
        sent?: boolean;
      } | null;

      if (!res.ok) {
        throw new Error(data?.error ?? "Falha ao enviar teste");
      }

      toast.success(
        `Teste enviado para ${data?.recipientsSent ?? 0} destinatário(s)`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar teste");
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <Card className="h-full shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Destinatários dos alertas</CardTitle>
              <CardDescription>
                Números que recebem avisos de pedido (não é o número emissor). Ex.:
                5511999999999 ou (11) 99999-9999
              </CardDescription>
            </div>
            <Badge variant={activeCount > 0 ? "default" : "secondary"}>
              {activeCount} ativo{activeCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeCount === 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Nenhum destinatário ativo — alertas de novo pedido{" "}
                  <strong>não serão entregues</strong> até cadastrar pelo menos um
                  número.
                </p>
              </div>
            </div>
          )}

          {!whatsappConnected && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  WhatsApp desconectado — conecte o número emissor na aba Conexão
                  antes de enviar alertas.
                </p>
              </div>
            </div>
          )}

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
                <Input placeholder="(11) 99999-9999" {...form.register("phone")} />
              </div>
            </div>
            <div className="mt-4">
              <Button type="submit" className="w-full sm:w-auto">
                Adicionar
              </Button>
            </div>
          </form>

          {activeCount > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={testing || !whatsappConnected}
                onClick={() => void handleTestAlert()}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Testar alerta de pedido
              </Button>
            </div>
          )}

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
