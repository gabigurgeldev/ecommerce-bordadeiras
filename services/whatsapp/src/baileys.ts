import { existsSync } from "fs";
import { rm } from "fs/promises";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WASocket,
} from "@whiskeysockets/baileys";
import P from "pino";
import QRCode from "qrcode";
import { clearSession, getActiveRecipients, loadSession, saveSession } from "./db.js";

const logger = P({ level: "warn" });
const SESSION_ID = "default";
const AUTH_DIR = "./data/auth";

let sock: WASocket | null = null;
let currentQr: string | null = null;
let connectionStatus = "disconnected";
let starting = false;

export function getConnectionStatus() {
  return { status: connectionStatus, qr: currentQr };
}

async function persistAuthState(creds: object, keys: object, status: string, qr?: string | null) {
  await saveSession(SESSION_ID, {
    creds,
    keys,
    status,
    qrCode: qr ?? null,
  });
}

export async function startBaileys(): Promise<WASocket> {
  if (starting && sock) return sock;
  starting = true;

  const existing = await loadSession(SESSION_ID);
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  if (existing?.creds) {
    try {
      Object.assign(state.creds, existing.creds as object);
    } catch {
      /* use file state */
    }
  }

  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on("creds.update", async () => {
    await saveCreds();
    await persistAuthState(state.creds as object, {}, connectionStatus, currentQr);
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQr = await QRCode.toDataURL(qr);
      connectionStatus = "qr";
      await persistAuthState(state.creds as object, {}, connectionStatus, currentQr);
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

  starting = false;
  return sock;
}

export async function reconnect(): Promise<void> {
  if (sock) {
    sock.end(undefined);
    sock = null;
  }
  connectionStatus = "reconnecting";
  await startBaileys();
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

  connectionStatus = "disconnected";
  currentQr = null;

  if (existsSync(AUTH_DIR)) {
    await rm(AUTH_DIR, { recursive: true, force: true });
  }

  await clearSession(SESSION_ID);
  await startBaileys();
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

export async function getQrPayload() {
  const row = await loadSession(SESSION_ID);
  return {
    status: connectionStatus,
    qr: currentQr ?? row?.qrCode ?? undefined,
  };
}
