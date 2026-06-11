"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SessionState = {
  status: string;
  qr?: string;
  serviceReachable?: boolean;
  serviceError?: string;
  serviceUrl?: string;
  stale?: boolean;
};

const POLL_STATUSES = new Set(["qr", "disconnected", "reconnecting", "connecting"]);

export function WhatsappConnectPanel({ initialStatus }: { initialStatus: string }) {
  const [session, setSession] = useState<SessionState>({ status: initialStatus });
  const [loading, setLoading] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const statusRef = useRef(initialStatus);
  const serviceReachableRef = useRef<boolean | undefined>(undefined);

  const fetchQr = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/qr", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Falha ao buscar status");
      }
      const data = (await res.json()) as SessionState;
      statusRef.current = data.status;
      serviceReachableRef.current = data.serviceReachable;
      setSession(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha ao buscar status";
      serviceReachableRef.current = false;
      setSession((prev) => ({
        ...prev,
        status: "disconnected",
        qr: undefined,
        serviceReachable: false,
        serviceError: message,
      }));
      console.error(e);
    }
  }, []);

  useEffect(() => {
    void fetchQr();
    const interval = setInterval(() => {
      const shouldPoll =
        serviceReachableRef.current === false ||
        POLL_STATUSES.has(statusRef.current);
      if (shouldPoll) {
        void fetchQr();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchQr]);

  async function handleReconnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/reconnect", { method: "POST" });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? "Erro ao reconectar");
      toast.success("Reconectando…");
      await fetchQr();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível reconectar");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/logout", { method: "POST" });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? "Erro ao desconectar");
      toast.success("Sessão encerrada. Escaneie o novo QR.");
      await fetchQr();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível desconectar");
    } finally {
      setLoading(false);
      setLogoutConfirmOpen(false);
    }
  }

  const statusLabel: Record<string, string> = {
    connected: "Conectado",
    qr: "Aguardando QR",
    disconnected: "Desconectado",
    reconnecting: "Reconectando",
    connecting: "Conectando",
  };

  const isConnected = session.status === "connected";
  const serviceDown = session.serviceReachable === false;

  return (
    <>
      <Card className="h-full shadow-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                isConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground",
              )}
            >
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base">Número emissor (Baileys)</CardTitle>
              <CardDescription>
                Escaneie o QR com o WhatsApp que enviará as notificações da loja.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceDown && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Serviço WhatsApp indisponível</p>
                  <p className="text-xs opacity-90">
                    {session.serviceError ??
                      "A app não conseguiu falar com o microsserviço Baileys."}
                  </p>
                  {session.serviceUrl && (
                    <p className="text-xs opacity-75">
                      URL configurada: <code>{session.serviceUrl}</code>
                    </p>
                  )}
                  <p className="text-xs opacity-75">
                    Confirme no EasyPanel/VPS: container <strong>whatsapp-service</strong> rodando,
                    mesma rede Docker da app, e <code>WHATSAPP_SERVICE_URL=http://whatsapp-service:4001</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {statusLabel[session.status] ?? session.status}
            </Badge>
          </div>

          {session.qr ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-white p-4 dark:bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session.qr}
                alt="QR Code WhatsApp"
                width={256}
                height={256}
                className="h-auto w-full max-w-[16rem] sm:max-w-[18rem]"
              />
              <p className="max-w-xs text-center text-xs text-muted-foreground">
                WhatsApp → Aparelhos conectados → Conectar aparelho
              </p>
            </div>
          ) : isConnected ? (
            <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Sessão ativa. Alertas serão enviados deste número.
            </p>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              {serviceDown
                ? "Sem conexão com o serviço. O QR só aparece quando o whatsapp-service estiver acessível."
                : "Aguardando QR… O código deve aparecer em alguns segundos."}
            </p>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <Button type="button" variant="outline" disabled={loading} onClick={handleReconnect}>
              Reconectar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={loading}
              onClick={() => setLogoutConfirmOpen(true)}
            >
              Novo número (logout)
            </Button>
          </div>
        </CardContent>
      </Card>

      <AdminConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        title="Desconectar WhatsApp?"
        description="Será gerado um novo QR. Use para trocar o número emissor das notificações."
        confirmLabel="Desconectar"
        destructive
        onConfirm={handleLogout}
      />
    </>
  );
}
