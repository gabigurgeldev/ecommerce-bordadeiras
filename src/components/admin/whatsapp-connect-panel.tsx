"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SessionState = {
  status: string;
  qr?: string;
};

export function WhatsappConnectPanel({ initialStatus }: { initialStatus: string }) {
  const [session, setSession] = useState<SessionState>({ status: initialStatus });
  const [loading, setLoading] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const fetchQr = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/qr", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao buscar status");
      const data = (await res.json()) as SessionState;
      setSession(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    void fetchQr();
    const interval = setInterval(() => {
      if (session.status === "qr" || session.status === "disconnected" || session.status === "reconnecting") {
        void fetchQr();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchQr, session.status]);

  async function handleReconnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/reconnect", { method: "POST" });
      if (!res.ok) throw new Error("Erro ao reconectar");
      toast.success("Reconectando…");
      await fetchQr();
    } catch {
      toast.error("Não foi possível reconectar");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/logout", { method: "POST" });
      if (!res.ok) throw new Error("Erro ao desconectar");
      toast.success("Sessão encerrada. Escaneie o novo QR.");
      await fetchQr();
    } catch {
      toast.error("Não foi possível desconectar");
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
  };

  const isConnected = session.status === "connected";

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
              Aguardando QR… Confirme se o serviço whatsapp está em execução na VPS.
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
