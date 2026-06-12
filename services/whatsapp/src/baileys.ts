import NodeCache from "@cacheable/node-cache";
import { existsSync } from "fs";
import { rm } from "fs/promises";
import makeWASocket, {
  Browsers,
  DEFAULT_CACHE_TTLS,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
  useMultiFileAuthState,
  type CacheStore,
  type WASocket,
  type WAVersion,
} from "@whiskeysockets/baileys";
import P from "pino";
import QRCode from "qrcode";
import { clearSession, getActiveRecipients, saveSession } from "./db.js";
import { appendLog, maskPhone } from "./log-bus.js";
import { flushOutboundQueue } from "./message-queue.js";

const logger = P({ level: "warn" });
const SESSION_ID = "default";
const AUTH_DIR = "./data/auth";

/** Used when fetchLatestBaileysVersion fails or WhatsApp rejects the fetched version. */
const FALLBACK_WA_VERSION: WAVersion = [2, 3000, 1033893291];

let sock: WASocket | null = null;
let currentQr: string | null = null;
let connectionStatus = "disconnected";
let startPromise: Promise<WASocket> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const messageStore = new Map<string, proto.IMessage>();
const msgRetryCounterCache = new NodeCache({
  stdTTL: DEFAULT_CACHE_TTLS.MSG_RETRY,
  useClones: false,
}) as unknown as CacheStore;

function messageStoreKey(key: proto.IMessageKey): string | null {
  if (!key.remoteJid || !key.id) return null;
  return `${key.remoteJid}:${key.id}:${key.fromMe ? "1" : "0"}`;
}

function rememberMessage(key: proto.IMessageKey, message: proto.IMessage | null | undefined) {
  const storeKey = messageStoreKey(key);
  if (!storeKey || !message) return;
  messageStore.set(storeKey, message);
  if (messageStore.size > 500) {
    const oldest = messageStore.keys().next().value;
    if (oldest) messageStore.delete(oldest);
  }
}

export function normalizePhoneDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/** Brazilian mobiles may be stored with or without the 9th digit — try both. */
export function buildBrazilPhoneCandidates(raw: string): string[] {
  const base = normalizePhoneDigits(raw);
  if (!base) return [];

  const candidates: string[] = [base];
  if (base.startsWith("55") && (base.length === 12 || base.length === 13)) {
    const area = base.slice(2, 4);
    const local = base.slice(4);
    if (base.length === 13 && local.length === 9 && local.startsWith("9")) {
      candidates.push(`55${area}${local.slice(1)}`);
    } else if (base.length === 12 && local.length === 8) {
      candidates.push(`55${area}9${local}`);
    }
  }
  return [...new Set(candidates)];
}

async function resolveDeliveryJid(phone: string): Promise<{ jid: string; digits: string }> {
  if (!sock || connectionStatus !== "connected") {
    throw new Error("NOT_CONNECTED: WhatsApp not connected");
  }

  const candidates = buildBrazilPhoneCandidates(phone);
  if (candidates.length === 0) {
    throw new Error("Invalid phone number");
  }

  for (const digits of candidates) {
    const pnJid = `${digits}@s.whatsapp.net`;
    try {
      const results = await sock.onWhatsApp(pnJid);
      const hit = results?.find((entry) => !!entry.exists);
      if (hit?.jid) {
        if (hit.jid !== pnJid) {
          appendLog({
            level: "info",
            category: "send",
            message: "Destinatário resolvido via onWhatsApp (LID/PN)",
            meta: {
              phone: maskPhone(digits),
              resolvedJid: hit.jid.endsWith("@lid") ? "lid" : "pn",
            },
          });
        }
        return { jid: hit.jid, digits };
      }
    } catch (err) {
      appendLog({
        level: "warn",
        category: "send",
        message: "onWhatsApp falhou para candidato de telefone",
        meta: {
          phone: maskPhone(digits),
          error: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  throw new Error(
    `NOT_ON_WHATSAPP: Número não registrado no WhatsApp (${maskPhone(candidates[0])})`,
  );
}

export function getConnectionStatus() {
  return { status: connectionStatus, qr: currentQr };
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function teardownSocket(socket: WASocket | null) {
  if (!socket) return;
  try {
    socket.end(undefined);
  } catch {
    /* socket may already be closed */
  }
}

function scheduleReconnect(delayMs: number) {
  if (startPromise || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void startBaileys().catch((err) => {
      appendLog({
        level: "error",
        category: "connection",
        message: "Falha ao reconectar automaticamente",
        meta: { error: err instanceof Error ? err.message : String(err) },
      });
    });
  }, delayMs);
}

async function clearAuthFiles(): Promise<void> {
  if (existsSync(AUTH_DIR)) {
    await rm(AUTH_DIR, { recursive: true, force: true });
  }
  try {
    await clearSession(SESSION_ID);
  } catch (err) {
    appendLog({
      level: "error",
      category: "session",
      message: "Falha ao limpar sessão no banco",
      meta: { error: err instanceof Error ? err.message : String(err) },
    });
  }
}

async function resolveWaVersion(): Promise<WAVersion> {
  try {
    const { version } = await fetchLatestBaileysVersion();
    return version;
  } catch (err) {
    appendLog({
      level: "warn",
      category: "system",
      message: "fetchLatestBaileysVersion falhou — usando versão fallback",
      meta: { error: err instanceof Error ? err.message : String(err) },
    });
    return FALLBACK_WA_VERSION;
  }
}

async function persistAuthState(creds: object, keys: object, status: string, qr?: string | null) {
  try {
    await saveSession(SESSION_ID, {
      creds,
      keys,
      status,
      qrCode: qr ?? null,
    });
  } catch (err) {
    appendLog({
      level: "error",
      category: "session",
      message: "Falha ao persistir sessão no banco",
      meta: { error: err instanceof Error ? err.message : String(err) },
    });
  }
}

export async function startBaileys(): Promise<WASocket> {
  if (sock) return sock;
  if (startPromise) return startPromise;

  clearReconnectTimer();

  startPromise = (async () => {
    connectionStatus = "connecting";
    appendLog({
      level: "info",
      category: "connection",
      message: "Iniciando conexão Baileys",
    });

    const version = await resolveWaVersion();
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const socket = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      browser: Browsers.ubuntu("Chrome"),
      auth: {
        creds: state.creds,
        // Cache do signal key store evita "Failed to decrypt message" e
        // reduz a latência das init queries (causa comum do "Timed Out").
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      generateHighQualityLinkPreview: false,
      msgRetryCounterCache,
      getMessage: async (key) => {
        const storeKey = messageStoreKey(key);
        return storeKey ? messageStore.get(storeKey) : undefined;
      },
      // Sem timeout fixo nas queries: as init queries após o pareamento
      // costumam estourar o default (60s) em redes lentas → statusCode 408.
      defaultQueryTimeoutMs: undefined,
      connectTimeoutMs: 60_000,
      keepAliveIntervalMs: 15_000,
      retryRequestDelayMs: 500,
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });

    sock = socket;

    socket.ev.on("creds.update", async () => {
      await saveCreds();
      await persistAuthState(state.creds as object, {}, connectionStatus, currentQr);
    });

    socket.ev.on("messages.upsert", ({ messages }) => {
      for (const msg of messages) {
        rememberMessage(msg.key, msg.message);
      }
    });

    socket.ev.on("messages.update", (updates) => {
      for (const { key, update } of updates) {
        if (update.message) {
          rememberMessage(key, update.message);
        }
        if (update.status === proto.WebMessageInfo.Status.ERROR) {
          appendLog({
            level: "error",
            category: "send",
            message: "WhatsApp reportou falha na entrega da mensagem",
            meta: {
              remoteJid: key.remoteJid?.endsWith("@lid") ? "lid" : "pn",
              messageId: key.id ?? null,
            },
          });
        }
      }
    });

    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          currentQr = await QRCode.toDataURL(qr);
          connectionStatus = "qr";
          await persistAuthState(state.creds as object, {}, connectionStatus, currentQr);
          appendLog({
            level: "info",
            category: "connection",
            message: "QR Code gerado — aguardando escaneamento",
          });
        } catch (err) {
          appendLog({
            level: "error",
            category: "connection",
            message: "Falha ao gerar QR Code",
            meta: { error: err instanceof Error ? err.message : String(err) },
          });
        }
      }

      if (connection === "open") {
        connectionStatus = "connected";
        currentQr = null;
        clearReconnectTimer();
        await persistAuthState(state.creds as object, {}, connectionStatus, null);
        appendLog({
          level: "success",
          category: "connection",
          message: "WhatsApp conectado",
        });
        void flushOutboundQueue();
      }

      if (connection === "close") {
        const code = (
          lastDisconnect?.error as { output?: { statusCode?: number } } | undefined
        )?.output?.statusCode;
        connectionStatus = "disconnected";
        currentQr = null;
        await persistAuthState(state.creds as object, {}, connectionStatus, null);
        const closedSock = sock;
        sock = null;
        teardownSocket(closedSock);

        if (code === DisconnectReason.loggedOut) {
          appendLog({
            level: "warn",
            category: "connection",
            message: "Sessão encerrada (loggedOut) — limpando auth para novo QR",
            meta: { code: code ?? null },
          });
          await clearAuthFiles();
          scheduleReconnect(1000);
          return;
        }

        appendLog({
          level: "warn",
          category: "connection",
          message: "Conexão fechada — reconectando",
          meta: { code: code ?? null },
        });

        const delayMs = code === DisconnectReason.restartRequired ? 0 : 5000;
        scheduleReconnect(delayMs);
      }
    });

    return socket;
  })();

  try {
    return await startPromise;
  } catch (err) {
    connectionStatus = "disconnected";
    appendLog({
      level: "error",
      category: "connection",
      message: "Falha ao iniciar Baileys",
      meta: { error: err instanceof Error ? err.message : String(err) },
    });
    throw err;
  } finally {
    startPromise = null;
  }
}

export async function reconnect(): Promise<void> {
  appendLog({ level: "info", category: "session", message: "Reconexão solicitada" });
  clearReconnectTimer();
  const existing = sock;
  sock = null;
  teardownSocket(existing);
  startPromise = null;
  connectionStatus = "reconnecting";
  void startBaileys().catch((err) => {
    appendLog({
      level: "error",
      category: "session",
      message: "Falha ao iniciar após reconnect",
      meta: { error: err instanceof Error ? err.message : String(err) },
    });
  });
}

export async function logoutSession(): Promise<void> {
  appendLog({ level: "info", category: "session", message: "Logout solicitado" });
  clearReconnectTimer();
  const existing = sock;
  sock = null;
  if (existing) {
    try {
      await existing.logout();
    } catch {
      /* session may already be invalid */
    }
    teardownSocket(existing);
  }
  startPromise = null;

  connectionStatus = "disconnected";
  currentQr = null;

  await clearAuthFiles();

  void startBaileys().catch((err) => {
    appendLog({
      level: "error",
      category: "session",
      message: "Falha ao iniciar após logout",
      meta: { error: err instanceof Error ? err.message : String(err) },
    });
  });
}

export type AdminMessageResult = { sent: number; skipped: number };

export async function sendAdminMessage(text: string): Promise<AdminMessageResult> {
  if (!sock || connectionStatus !== "connected") {
    throw new Error("NOT_CONNECTED: WhatsApp not connected");
  }

  const recipients = await getActiveRecipients();
  if (recipients.length === 0) {
    throw new Error(
      "NO_RECIPIENTS: Nenhum destinatário ativo cadastrado em WhatsappRecipient",
    );
  }

  let sent = 0;
  let skipped = 0;

  for (const recipient of recipients) {
    try {
      const { jid, digits } = await resolveDeliveryJid(String(recipient.phone));
      const sentMsg = await sock.sendMessage(jid, { text });
      if (sentMsg) rememberMessage(sentMsg.key, sentMsg.message);
      sent++;
      appendLog({
        level: "success",
        category: "send",
        message: "Mensagem enviada para destinatário admin",
        meta: {
          phone: maskPhone(digits),
          label: recipient.label ? String(recipient.label) : null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith("Invalid phone") || message.startsWith("NOT_ON_WHATSAPP:")) {
        skipped++;
        appendLog({
          level: "warn",
          category: "send",
          message: "Destinatário admin ignorado — telefone inválido ou ausente no WhatsApp",
          meta: {
            label: recipient.label ? String(recipient.label) : null,
            phone: maskPhone(String(recipient.phone)),
            error: message.replace(/^[A-Z_]+:\s*/, ""),
          },
        });
        continue;
      }
      appendLog({
        level: "error",
        category: "send",
        message: "Falha ao enviar para destinatário admin",
        meta: {
          phone: maskPhone(String(recipient.phone)),
          error: message,
        },
      });
      throw err;
    }
  }

  if (sent === 0) {
    throw new Error(
      skipped > 0
        ? "INVALID_PHONES: Nenhum destinatário com telefone válido"
        : "NO_RECIPIENTS: Nenhum destinatário ativo cadastrado",
    );
  }

  return { sent, skipped };
}

export async function sendMessageToPhone(phone: string, text: string): Promise<void> {
  if (!sock || connectionStatus !== "connected") {
    throw new Error("NOT_CONNECTED: WhatsApp not connected");
  }

  try {
    const { jid, digits } = await resolveDeliveryJid(phone);
    const sentMsg = await sock.sendMessage(jid, { text });
    if (sentMsg) rememberMessage(sentMsg.key, sentMsg.message);
    appendLog({
      level: "success",
      category: "send",
      message: "Mensagem enviada para cliente",
      meta: { phone: maskPhone(digits) },
    });
  } catch (err) {
    appendLog({
      level: "error",
      category: "send",
      message: "Falha ao enviar para cliente",
      meta: {
        phone: maskPhone(phone),
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

export async function getQrPayload() {
  return {
    status: connectionStatus,
    qr: connectionStatus === "qr" ? (currentQr ?? undefined) : undefined,
  };
}

/** Read-only status — does not start or restart the Baileys connection. */
export function getSessionSnapshot() {
  return {
    status: connectionStatus,
    qr: connectionStatus === "qr" ? (currentQr ?? undefined) : undefined,
  };
}
