import { randomUUID } from "crypto";

export type WhatsappLogLevel = "info" | "success" | "warn" | "error";
export type WhatsappLogSource = "service" | "app";
export type WhatsappLogCategory =
  | "connection"
  | "session"
  | "send"
  | "notify"
  | "system";

export type WhatsappLogEntry = {
  id: string;
  ts: string;
  level: WhatsappLogLevel;
  source: WhatsappLogSource;
  category: WhatsappLogCategory;
  message: string;
  meta?: Record<string, string | number | boolean | null>;
};

export type WhatsappLogInput = Omit<WhatsappLogEntry, "id" | "ts" | "source"> & {
  source?: WhatsappLogSource;
};

const MAX_LOGS = 300;
const buffer: WhatsappLogEntry[] = [];
const subscribers = new Set<(entry: WhatsappLogEntry) => void>();

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `${digits.slice(0, -4)}****`;
}

export function appendLog(input: WhatsappLogInput): WhatsappLogEntry {
  const entry: WhatsappLogEntry = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    source: input.source ?? "service",
    level: input.level,
    category: input.category,
    message: input.message,
    ...(input.meta && Object.keys(input.meta).length > 0 ? { meta: input.meta } : {}),
  };

  buffer.push(entry);
  if (buffer.length > MAX_LOGS) {
    buffer.splice(0, buffer.length - MAX_LOGS);
  }

  for (const subscriber of subscribers) {
    try {
      subscriber(entry);
    } catch {
      /* ignore subscriber errors */
    }
  }

  const prefix = `[whatsapp/${entry.category}]`;
  const line = `${prefix} ${entry.message}`;
  if (entry.level === "error") console.error(line, entry.meta ?? "");
  else if (entry.level === "warn") console.warn(line, entry.meta ?? "");
  else console.log(line, entry.meta ?? "");

  return entry;
}

export function getRecentLogs(limit = MAX_LOGS): WhatsappLogEntry[] {
  const count = Math.min(Math.max(1, limit), MAX_LOGS);
  return buffer.slice(-count);
}

export function subscribe(callback: (entry: WhatsappLogEntry) => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function ingestLog(input: WhatsappLogInput): WhatsappLogEntry {
  return appendLog({ ...input, source: input.source ?? "app" });
}
