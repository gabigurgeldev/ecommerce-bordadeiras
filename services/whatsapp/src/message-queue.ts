import { randomUUID } from "crypto";
import { appendLog, maskPhone } from "./log-bus.js";

export type OutboundQueueItem = {
  id: string;
  kind: "admin" | "phone";
  text: string;
  phone?: string;
  label?: string;
  retries: number;
  maxRetries: number;
  nextAttemptAt: number;
};

const MAX_QUEUE = 300;
const MAX_RETRIES = 5;
const queue: OutboundQueueItem[] = [];
let flushing = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

type SendAdminFn = (text: string) => Promise<unknown>;
type SendPhoneFn = (phone: string, text: string) => Promise<void>;
type ConnectionStatusFn = () => { status: string };

let sendAdminFn: SendAdminFn | null = null;
let sendPhoneFn: SendPhoneFn | null = null;
let connectionStatusFn: ConnectionStatusFn | null = null;

export function bindOutboundQueue(handlers: {
  sendAdmin: SendAdminFn;
  sendPhone: SendPhoneFn;
  getConnectionStatus: ConnectionStatusFn;
}) {
  sendAdminFn = handlers.sendAdmin;
  sendPhoneFn = handlers.sendPhone;
  connectionStatusFn = handlers.getConnectionStatus;
}

export function isRetryableSendError(message: string): boolean {
  if (message.startsWith("NOT_CONNECTED:")) return true;
  if (message.startsWith("NOT_ON_WHATSAPP:")) return false;
  if (message.startsWith("Invalid phone")) return false;
  if (message.startsWith("NO_RECIPIENTS:")) return false;
  if (message.startsWith("INVALID_PHONES:")) return false;
  if (/timeout|timed out|connection closed|stream errored|econnreset/i.test(message)) {
    return true;
  }
  return true;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function backoffMs(retries: number): number {
  return Math.min(60_000, 2_000 * 2 ** retries);
}

export function getOutboundQueueSize(): number {
  return queue.length;
}

export function enqueueOutbound(
  item: {
    kind: "admin" | "phone";
    text: string;
    phone?: string;
    label?: string;
    maxRetries?: number;
  },
): string {
  const entry: OutboundQueueItem = {
    id: randomUUID(),
    kind: item.kind,
    text: item.text,
    phone: item.phone,
    label: item.label,
    retries: 0,
    maxRetries: item.maxRetries ?? MAX_RETRIES,
    nextAttemptAt: Date.now(),
  };

  queue.push(entry);
  if (queue.length > MAX_QUEUE) {
    const dropped = queue.shift();
    if (dropped) {
      appendLog({
        level: "warn",
        category: "send",
        message: "Fila de envio cheia — mensagem mais antiga descartada",
        meta: { kind: dropped.kind, label: dropped.label ?? null },
      });
    }
  }

  appendLog({
    level: "warn",
    category: "send",
    message: "Mensagem enfileirada para reenvio",
    meta: {
      kind: item.kind,
      label: item.label ?? null,
      queueSize: queue.length,
    },
  });

  scheduleFlush(500);
  return entry.id;
}

function scheduleFlush(delayMs = 0) {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushOutboundQueue();
  }, delayMs);
}

export async function flushOutboundQueue(): Promise<void> {
  if (flushing || queue.length === 0) return;
  if (!sendAdminFn || !sendPhoneFn || !connectionStatusFn) return;
  if (connectionStatusFn().status !== "connected") return;

  flushing = true;

  try {
    const now = Date.now();
    const ready = queue
      .filter((item) => item.nextAttemptAt <= now)
      .sort((a, b) => a.nextAttemptAt - b.nextAttemptAt);

    for (const item of ready) {
      if (connectionStatusFn().status !== "connected") break;

      const idx = queue.findIndex((q) => q.id === item.id);
      if (idx === -1) continue;
      queue.splice(idx, 1);

      try {
        if (item.kind === "admin") {
          await sendAdminFn(item.text);
        } else if (item.phone) {
          await sendPhoneFn(item.phone, item.text);
        }
        appendLog({
          level: "success",
          category: "send",
          message: "Mensagem reenviada da fila",
          meta: {
            kind: item.kind,
            label: item.label ?? null,
            retries: item.retries,
          },
        });
      } catch (err) {
        const message = errorMessage(err);
        if (isRetryableSendError(message) && item.retries < item.maxRetries) {
          item.retries += 1;
          item.nextAttemptAt = Date.now() + backoffMs(item.retries);
          queue.push(item);
          appendLog({
            level: "warn",
            category: "send",
            message: "Reenvio da fila falhou — nova tentativa agendada",
            meta: {
              kind: item.kind,
              label: item.label ?? null,
              retries: item.retries,
              error: message.replace(/^[A-Z_]+:\s*/, ""),
            },
          });
          if (message.startsWith("NOT_CONNECTED:")) break;
          scheduleFlush(backoffMs(item.retries));
        } else {
          appendLog({
            level: "error",
            category: "send",
            message: "Mensagem descartada da fila após esgotar tentativas",
            meta: {
              kind: item.kind,
              label: item.label ?? null,
              phone: item.phone ? maskPhone(item.phone) : null,
              error: message.replace(/^[A-Z_]+:\s*/, ""),
            },
          });
        }
      }
    }

    if (queue.some((item) => item.nextAttemptAt <= Date.now())) {
      scheduleFlush(500);
    } else if (queue.length > 0) {
      const nextAt = Math.min(...queue.map((item) => item.nextAttemptAt));
      scheduleFlush(Math.max(500, nextAt - Date.now()));
    }
  } finally {
    flushing = false;
  }
}

export type SendOptions = {
  queueOnFailure?: boolean;
  queueLabel?: string;
};

export async function sendAdminWithQueue(
  sendFn: SendAdminFn,
  text: string,
  options?: SendOptions,
): Promise<{ queued: boolean; queueId?: string; result?: unknown }> {
  try {
    const result = await sendFn(text);
    return { queued: false, result };
  } catch (err) {
    const message = errorMessage(err);
    if (options?.queueOnFailure && isRetryableSendError(message)) {
      const queueId = enqueueOutbound({
        kind: "admin",
        text,
        label: options.queueLabel ?? "admin",
      });
      return { queued: true, queueId };
    }
    throw err;
  }
}

export async function sendPhoneWithQueue(
  sendFn: SendPhoneFn,
  phone: string,
  text: string,
  options?: SendOptions,
): Promise<{ queued: boolean; queueId?: string }> {
  try {
    await sendFn(phone, text);
    return { queued: false };
  } catch (err) {
    const message = errorMessage(err);
    if (options?.queueOnFailure && isRetryableSendError(message)) {
      const queueId = enqueueOutbound({
        kind: "phone",
        phone,
        text,
        label: options.queueLabel ?? maskPhone(phone),
      });
      return { queued: true, queueId };
    }
    throw err;
  }
}
