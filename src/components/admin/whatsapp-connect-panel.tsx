"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SessionState = {
  status: string;
  qr?: string;
};

export function WhatsappConnectPanel({ initialStatus }: { initialStatus: string }) {
  const [session, setSession] = useState<SessionState>({ status: initialStatus });
  const [loading, setLoading] = useState(false);

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
    if (!confirm("Desconectar e gerar novo QR? Use para trocar o número emissor.")) return;
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
    }
  }

  const statusLabel: Record<string, string> = {
    connected: "Conectado",
    qr: "Aguardando QR",
    disconnected: "Desconectado",
    reconnecting: "Reconectando",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Número emissor (Baileys)</CardTitle>
        <CardDescription>
          Escaneie o QR com o WhatsApp que enviará as notificações da loja.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge variant={session.status === "connected" ? "default" : "secondary"}>
            {statusLabel[session.status] ?? session.status}
          </Badge>
        </div>

        {session.qr ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-white p-4">
            <Image
              src={session.qr}
              alt="QR Code WhatsApp"
              width={256}
              height={256}
              unoptimized
              className="h-64 w-64"
            />
            <p className="text-center text-xs text-muted-foreground">
              WhatsApp → Aparelhos conectados → Conectar aparelho
            </p>
          </div>
        ) : session.status === "connected" ? (
          <p className="text-sm text-muted-foreground">Sessão ativa. Alertas serão enviados deste número.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aguardando QR… Confirme se o serviço whatsapp está em execução na VPS.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={handleReconnect}>
            Reconectar
          </Button>
          <Button type="button" variant="destructive" disabled={loading} onClick={handleLogout}>
            Novo número (logout)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
