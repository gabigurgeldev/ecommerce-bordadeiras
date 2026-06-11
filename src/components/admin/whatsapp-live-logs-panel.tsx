"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Radio, ScrollText, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WhatsappLogEntry, WhatsappLogLevel } from "@/lib/whatsapp-log-types";
import { cn } from "@/lib/utils";

const MAX_DISPLAY = 300;
const LEVELS: WhatsappLogLevel[] = ["info", "success", "warn", "error"];

const levelStyles: Record<WhatsappLogLevel, string> = {
  info: "text-sky-400",
  success: "text-emerald-400",
  warn: "text-amber-400",
  error: "text-red-400",
};

const levelLabels: Record<WhatsappLogLevel, string> = {
  info: "INFO",
  success: "OK",
  warn: "WARN",
  error: "ERRO",
};

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

function formatMeta(meta?: WhatsappLogEntry["meta"]) {
  if (!meta || Object.keys(meta).length === 0) return null;
  return Object.entries(meta)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(" ");
}

export function WhatsappLiveLogsPanel() {
  const [logs, setLogs] = useState<WhatsappLogEntry[]>([]);
  const [streamStatus, setStreamStatus] = useState<"connecting" | "live" | "offline">(
    "connecting",
  );
  const [paused, setPaused] = useState(false);
  const [levelFilter, setLevelFilter] = useState<Set<WhatsappLogLevel>>(
    () => new Set(LEVELS),
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const seenIds = useRef(new Set<string>());
  const reconnectDelay = useRef(3000);

  pausedRef.current = paused;

  const appendLog = useCallback((entry: WhatsappLogEntry) => {
    if (seenIds.current.has(entry.id)) return;
    seenIds.current.add(entry.id);
    setLogs((prev) => {
      const next = [...prev, entry];
      if (next.length > MAX_DISPLAY) return next.slice(-MAX_DISPLAY);
      return next;
    });
  }, []);

  const loadSnapshot = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/logs", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { logs?: WhatsappLogEntry[] };
      const items = data.logs ?? [];
      for (const entry of items) {
        if (!seenIds.current.has(entry.id)) {
          seenIds.current.add(entry.id);
        }
      }
      setLogs((prev) => {
        const merged = [...items, ...prev];
        const byId = new Map<string, WhatsappLogEntry>();
        for (const e of merged) byId.set(e.id, e);
        return Array.from(byId.values())
          .sort((a, b) => a.ts.localeCompare(b.ts))
          .slice(-MAX_DISPLAY);
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, paused]);

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      setStreamStatus("connecting");
      source = new EventSource("/api/admin/whatsapp/logs/stream");

      source.addEventListener("log", (event) => {
        try {
          const entry = JSON.parse(event.data) as WhatsappLogEntry;
          appendLog(entry);
        } catch {
          /* ignore malformed */
        }
      });

      source.onopen = () => {
        reconnectDelay.current = 3000;
        setStreamStatus("live");
      };

      source.onerror = () => {
        setStreamStatus("offline");
        source?.close();
        source = null;
        if (!cancelled) {
          reconnectTimer = setTimeout(() => {
            connect();
            reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 10_000);
          }, reconnectDelay.current);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [appendLog]);

  const filtered = logs.filter((l) => levelFilter.has(l.level));

  function toggleLevel(level: WhatsappLogLevel) {
    setLevelFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Logs ao vivo
            </CardTitle>
            <CardDescription>
              Envios, conexão, notificações de pedido e erros do WhatsApp em tempo real.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {streamStatus === "live" ? (
              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                <Radio className="h-3 w-3" />
                Ao vivo
              </Badge>
            ) : streamStatus === "connecting" ? (
              <Badge variant="secondary" className="gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Conectando…
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Reconectando
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {paused ? "Retomar scroll" : "Pausar scroll"}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => toggleLevel(level)}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
                levelFilter.has(level)
                  ? "border-border bg-muted text-foreground"
                  : "border-transparent text-muted-foreground opacity-50",
              )}
            >
              {levelLabels[level]}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="h-72 overflow-y-auto rounded-lg border bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-100"
        >
          {filtered.length === 0 ? (
            <p className="text-zinc-500">
              {streamStatus === "offline"
                ? "Serviço WhatsApp indisponível. Os logs aparecerão quando a conexão for restabelecida."
                : "Aguardando eventos… Conecte o WhatsApp ou envie um teste de alerta."}
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((entry) => {
                const meta = formatMeta(entry.meta);
                return (
                  <li key={entry.id} className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <span className="shrink-0 text-zinc-500">{formatTime(entry.ts)}</span>
                    <span
                      className={cn("shrink-0 font-semibold", levelStyles[entry.level])}
                    >
                      {levelLabels[entry.level]}
                    </span>
                    <span className="shrink-0 text-zinc-500">
                      [{entry.source}/{entry.category}]
                    </span>
                    <span className="min-w-0 break-words text-zinc-200">{entry.message}</span>
                    {meta && (
                      <span className="w-full break-all text-zinc-500 pl-[4.5rem] sm:pl-0 sm:w-auto">
                        {meta}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Histórico em memória no microsserviço (últimos ~300 eventos). Reiniciar o container
          whatsapp-service limpa os logs.
        </p>
      </CardContent>
    </Card>
  );
}
