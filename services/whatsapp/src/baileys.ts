import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WASocket,
} from "@whiskeysockets/baileys";
import P from "pino";
import QRCode from "qrcode";
import { loadSession, saveSession } from "./db.js";

const logger = P({ level: "warn" });
const SESSION_ID = "default";

let sock: WASocket | null = null;
let currentQr: string | null = null;
let connectionStatus = "disconnected";

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
  const existing = await loadSession(SESSION_ID);
  const { state, saveCreds } = await useMultiFileAuthState("./data/auth");

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
    await persistAuthState(
      state.creds as object,
      {},
      connectionStatus,
      currentQr
    );
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

      if (code !== DisconnectReason.loggedOut) {
        setTimeout(() => void startBaileys(), 5000);
      }
    }
  });

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

export async function sendAdminMessage(text: string): Promise<void> {
  const admin = process.env.WHATSAPP_ADMIN_NUMBER;
  if (!admin) {
    console.warn("[whatsapp] WHATSAPP_ADMIN_NUMBER not set");
    return;
  }
  if (!sock || connectionStatus !== "connected") {
    throw new Error("WhatsApp not connected");
  }
  const jid = admin.includes("@") ? admin : `${admin.replace(/\D/g, "")}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text });
}

export async function getQrPayload() {
  const row = await loadSession(SESSION_ID);
  return {
    status: connectionStatus,
    qr: currentQr ?? row?.qrCode ?? undefined,
  };
}
