import { existsSync } from "fs";
import { rm } from "fs/promises";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WASocket,
  type WAVersion,
} from "@whiskeysockets/baileys";
import P from "pino";
import QRCode from "qrcode";
import { clearSession, getActiveRecipients, loadSession, saveSession } from "./db.js";

const logger = P({ level: "warn" });
const SESSION_ID = "default";
const AUTH_DIR = "./data/auth";

/** Used when fetchLatestBaileysVersion fails or WhatsApp rejects the fetched version. */
const FALLBACK_WA_VERSION: WAVersion = [2, 3000, 1033893291];

let sock: WASocket | null = null;
let currentQr: string | null = null;
let connectionStatus = "disconnected";
let startPromise: Promise<WASocket> | null = null;

export function getConnectionStatus() {
  return { status: connectionStatus, qr: currentQr };
}

async function resolveWaVersion(): Promise<WAVersion> {
  try {
    const { version } = await fetchLatestBaileysVersion();
    return version;
  } catch (err) {
    console.warn("[whatsapp] fetchLatestBaileysVersion failed, using fallback:", err);
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
    console.error("[whatsapp] Failed to persist session to DB:", err);
  }
}

export async function startBaileys(): Promise<WASocket> {
  if (sock) return sock;
  if (startPromise) return startPromise;

  startPromise = (async () => {
    connectionStatus = "connecting";

    const version = await resolveWaVersion();
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const socket = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      browser: Browsers.ubuntu("Bordadeiras"),
      auth: state,
      generateHighQualityLinkPreview: true,
    });

    sock = socket;

    socket.ev.on("creds.update", async () => {
      await saveCreds();
      await persistAuthState(state.creds as object, {}, connectionStatus, currentQr);
    });

    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          currentQr = await QRCode.toDataURL(qr);
          connectionStatus = "qr";
          await persistAuthState(state.creds as object, {}, connectionStatus, currentQr);
        } catch (err) {
          console.error("[whatsapp] QR encode failed:", err);
        }
      }

      if (connection === "open") {
        connectionStatus = "connected";
        currentQr = null;
        await persistAuthState(state.creds as object, {}, connectionStatus, null);
      }

      if (connection === "close") {
        const code = (
          lastDisconnect?.error as { output?: { statusCode?: number } } | undefined
        )?.output?.statusCode;
        connectionStatus = "disconnected";
        currentQr = null;
        await persistAuthState(state.creds as object, {}, connectionStatus, null);
        sock = null;

        if (code !== DisconnectReason.loggedOut) {
          setTimeout(() => void startBaileys(), 5000);
        }
      }
    });

    return socket;
  })();

  try {
    return await startPromise;
  } catch (err) {
    connectionStatus = "disconnected";
    console.error("[whatsapp] startBaileys failed:", err);
    throw err;
  } finally {
    startPromise = null;
  }
}

export async function reconnect(): Promise<void> {
  if (sock) {
    sock.end(undefined);
    sock = null;
  }
  startPromise = null;
  connectionStatus = "reconnecting";
  void startBaileys().catch((err) => console.error("[whatsapp] reconnect start failed:", err));
}

export async function logoutSession(): Promise<void> {
  if (sock) {
    try {
      await sock.logout();
    } catch {
      /* session may already be invalid */
    }
    sock.end(undefined);
    sock = null;
  }
  startPromise = null;

  connectionStatus = "disconnected";
  currentQr = null;

  if (existsSync(AUTH_DIR)) {
    await rm(AUTH_DIR, { recursive: true, force: true });
  }

  try {
    await clearSession(SESSION_ID);
  } catch (err) {
    console.error("[whatsapp] clearSession failed:", err);
  }

  void startBaileys().catch((err) => console.error("[whatsapp] logout start failed:", err));
}

export async function sendAdminMessage(text: string): Promise<void> {
  const recipients = await getActiveRecipients();
  if (recipients.length === 0) {
    console.warn("[whatsapp] No active recipients in WhatsappRecipient table");
    return;
  }
  if (!sock || connectionStatus !== "connected") {
    throw new Error("WhatsApp not connected");
  }

  for (const recipient of recipients) {
    const digits = recipient.phone.replace(/\D/g, "");
    if (!digits) continue;
    const jid = `${digits}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text });
  }
}

export async function sendMessageToPhone(phone: string, text: string): Promise<void> {
  if (!sock || connectionStatus !== "connected") {
    throw new Error("WhatsApp not connected");
  }

  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    throw new Error("Invalid phone number");
  }
  const jid = `${digits}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text });
}

export async function getQrPayload() {
  if (!sock && (connectionStatus === "disconnected" || connectionStatus === "reconnecting")) {
    void startBaileys().catch((err) => console.error("[whatsapp] lazy start failed:", err));
  }

  let qrFromDb: string | null | undefined;
  try {
    const row = await loadSession(SESSION_ID);
    qrFromDb = row?.qrCode != null ? String(row.qrCode) : null;
  } catch (err) {
    console.error("[whatsapp] loadSession failed:", err);
  }

  return {
    status: connectionStatus,
    qr: currentQr ?? qrFromDb ?? undefined,
  };
}
