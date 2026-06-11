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

type ServiceHealth = {
  connected: boolean;
  activeRecipients: number;
  supabaseConfigured: boolean;
  supabaseMissing?: string[];
  serviceReachable: boolean;
  serviceUrl?: string;
};

export function WhatsappRecipientsPanel({
  recipients,
  whatsappConnected: initialConnected = false,
}: {
  recipients: WhatsappRecipient[];
  whatsappConnected?: boolean;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [health, setHealth] = useState<ServiceHealth>({
    connected: initialConnected,
    activeRecipients: 0,
    supabaseConfigured: true,
    serviceReachable: true,
  });
  const activeCount = recipients.filter((r) => r.active).length;

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/health", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as {
        connected?: boolean;
        activeRecipients?: number;
        supabaseConfigured?: boolean;
        supabaseMissing?: string[];
        serviceReachable?: boolean;
        serviceUrl?: string;
        error?: string;
      } | null;

      if (!res.ok || !data) {
        setHealth({
          connected: false,
          activeRecipients: 0,
          supabaseConfigured: false,
          serviceReachable: false,
          serviceUrl: data?.serviceUrl,
        });
        return;
      }

      setHealth({
        connected: data.connected === true,
        activeRecipients: data.activeRecipients ?? 0,
        supabaseConfigured: data.supabaseConfigured !== false,
        supabaseMissing: data.supabaseMissing,
        serviceReachable: data.serviceReachable !== false,
        serviceUrl: data.serviceUrl,
      });
    } catch {
      setHealth({
        connected: false,
        activeRecipients: 0,
        supabaseConfigured: false,
        serviceReachable: false,
      });
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    void fetchHealth();
    const interval = setInterval(() => {
      void fetchHealth();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

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
        serviceUrl?: string;
        serviceReachable?: boolean;
      } | null;

      if (!res.ok) {
        let message = data?.error ?? "Falha ao enviar teste";
        if (data?.serviceReachable === false) {
          message = `Serviço WhatsApp inacessível${data.serviceUrl ? ` (${data.serviceUrl})` : ""}. Verifique se o container whatsapp-service está rodando.`;
        }
        throw new Error(message);
      }

      toast.success(
        `Teste enviado para ${data?.recipientsSent ?? 0} destinatário(s)`,
      );
      void fetchHealth();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar teste");
    } finally {
      setTesting(false);
    }
  }

  const showConnectionBanner = mounted && !health.connected && health.serviceReachable;
  const showServiceDownBanner = mounted && !health.serviceReachable;
  const showSupabaseBanner = mounted && health.serviceReachable && !health.supabaseConfigured;
  const showRecipientMismatchBanner =
    mounted &&
    health.serviceReachable &&
    health.supabaseConfigured &&
    activeCount > 0 &&
    health.activeRecipients === 0;

  const canTestAlert =
    health.serviceReachable && health.connected && health.activeRecipients > 0;

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
            <div className="flex flex-wrap gap-2">
              <Badge variant={activeCount > 0 ? "default" : "secondary"}>
                {activeCount} ativo{activeCount === 1 ? "" : "s"} na loja
              </Badge>
              {mounted && health.serviceReachable && (
                <Badge variant={health.activeRecipients > 0 ? "outline" : "secondary"}>
                  {health.activeRecipients} visto{health.activeRecipients === 1 ? "" : "s"} pelo serviço
                </Badge>
              )}
            </div>
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

          {showServiceDownBanner && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Serviço WhatsApp indisponível</p>
                  <p className="text-xs opacity-90">
                    A app não conseguiu falar com o microsserviço Baileys
                    {health.serviceUrl ? ` em ${health.serviceUrl}` : ""}.
                    Confirme que o container <strong>whatsapp-service</strong> está rodando e que{" "}
                    <code>WHATSAPP_SERVICE_URL</code> aponta para ele.
                  </p>
                </div>
              </div>
            </div>
          )}

          {showSupabaseBanner && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Supabase não configurado no whatsapp-service</p>
                  <p className="text-xs opacity-90">
                    O microsserviço não consegue ler destinatários nem templates. Configure no
                    container <strong>whatsapp-service</strong>:{" "}
                    <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
                    <code>SUPABASE_SERVICE_ROLE_KEY</code>.
                  </p>
                  {health.supabaseMissing && health.supabaseMissing.length > 0 && (
                    <p className="text-xs opacity-75">
                      Faltando: {health.supabaseMissing.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {showRecipientMismatchBanner && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Há {activeCount} destinatário(s) ativo(s) na loja, mas o microsserviço WhatsApp
                  enxerga <strong>0</strong>. Verifique as variáveis Supabase no container{" "}
                  <strong>whatsapp-service</strong> e reinicie o serviço.
                </p>
              </div>
            </div>
          )}

          {showConnectionBanner && (
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
                void fetchHealth();
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
                disabled={testing || !canTestAlert}
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
                              if (res.success) {
                                refresh();
                                void fetchHealth();
                              } else toast.error(res.error);
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
            void fetchHealth();
          } else toast.error(res.error);
        }}
      />
    </>
  );
}
