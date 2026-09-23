import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDir = path.join(__dirname, "../auth_info_baileys");

if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

let sock = null;
let connectionStatus = "disconnected"; // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
let qrCodeData = null; // base64 Data URL
let rawQr = null;
let pairingCode = null;
let connectedNumber = null;
let isInitializing = false;

export const formatSomaliPhone = (phone) => {
  if (!phone) return "";
  let cleaned = phone.toString().replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "252" + cleaned.substring(1);
  } else if (!cleaned.startsWith("252") && cleaned.length <= 9) {
    cleaned = "252" + cleaned;
  }
  return `${cleaned}@s.whatsapp.net`;
};

/**
 * Initialize WhatsApp Socket
 */
export const initWhatsApp = async (forceReset = false) => {
  if (isInitializing) return sock;
  isInitializing = true;

  if (forceReset) {
    try {
      if (sock) {
        sock.ev.removeAllListeners();
        sock.end();
      }
    } catch (e) {}
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
      fs.mkdirSync(authDir, { recursive: true });
    } catch (e) {}
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`[WhatsApp Gateway] Starting Baileys v${version.join(".")}...`);
    connectionStatus = "connecting";

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: ["Ubuntu", "Chrome", "120.0.0"],
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        rawQr = qr;
        try {
          qrCodeData = await qrcode.toDataURL(qr, { margin: 2, scale: 6 });
          connectionStatus = "qr_ready";
          console.log("[WhatsApp Gateway] ✅ Fresh QR code generated for authentication");
        } catch (err) {
          console.error("[WhatsApp Gateway] QR conversion error:", err);
        }
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        connectionStatus = "disconnected";
        qrCodeData = null;
        rawQr = null;
        pairingCode = null;

        console.log(`[WhatsApp Gateway] Connection closed (Status ${statusCode}). Reconnecting: ${shouldReconnect}`);

        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
            fs.mkdirSync(authDir, { recursive: true });
          } catch (e) {}
        }

        // Auto restart socket so it's always ready for pairing or QR scan
        setTimeout(() => {
          isInitializing = false;
          initWhatsApp();
        }, 3000);
      } else if (connection === "open") {
        connectionStatus = "connected";
        qrCodeData = null;
        rawQr = null;
        pairingCode = null;
        connectedNumber = sock?.user?.id?.split(":")[0] || sock?.user?.id || "252616408886";
        console.log(`[WhatsApp Gateway] 🟢 CONNECTED as: ${connectedNumber}`);
      }
    });

    isInitializing = false;
    return sock;
  } catch (error) {
    console.error("[WhatsApp Gateway] Init error:", error);
    connectionStatus = "disconnected";
    isInitializing = false;
    return null;
  }
};

/**
 * Request an 8-digit Pairing Code for a phone number
 */
export const requestPairingCodeForNumber = async (phoneNumber = "252616408886") => {
  let cleaned = phoneNumber.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) cleaned = "252" + cleaned.substring(1);
  else if (!cleaned.startsWith("252") && cleaned.length <= 9) cleaned = "252" + cleaned;

  // If sock is dead or disconnected, re-init first
  if (!sock || connectionStatus === "disconnected") {
    await initWhatsApp(true);
    // Wait 2 seconds for socket to start
    await new Promise((r) => setTimeout(r, 2000));
  }

  try {
    if (sock && !sock.authState.creds.registered) {
      console.log(`[WhatsApp Gateway] Requesting pairing code for ${cleaned}...`);
      const code = await sock.requestPairingCode(cleaned);
      pairingCode = code;
      console.log(`[WhatsApp Gateway] 🔑 New Pairing Code: ${code}`);
      return { success: true, pairingCode: code, phone: cleaned };
    } else if (sock?.authState?.creds?.registered) {
      return { success: true, alreadyConnected: true, connectedNumber: sock?.user?.id || "252616408886" };
    }
  } catch (err) {
    console.error("[WhatsApp Gateway] Pairing error:", err);
    // Try reinitializing and retrying
    await initWhatsApp(true);
    await new Promise((r) => setTimeout(r, 2500));
    try {
      if (sock) {
        const code = await sock.requestPairingCode(cleaned);
        pairingCode = code;
        return { success: true, pairingCode: code, phone: cleaned };
      }
    } catch (e2) {
      return { success: false, error: e2.message };
    }
    return { success: false, error: err.message };
  }
  return { success: false, error: "Gateway initializing, please retry in 2 seconds" };
};

/**
 * Force Refresh QR code
 */
export const refreshQR = async () => {
  if (connectionStatus !== "connected") {
    await initWhatsApp(true);
    // Wait for QR generation up to 4 seconds
    for (let i = 0; i < 8; i++) {
      if (qrCodeData) break;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return getWhatsAppStatus();
};

/**
 * Send WhatsApp text message
 */
export const sendWhatsAppMessage = async (toPhone, message) => {
  const targetJid = formatSomaliPhone(toPhone);

  if (!sock || connectionStatus !== "connected") {
    console.log(`[SOBDA System Message] 📨 Dispatched locally to ${toPhone}:\n${message}`);
    return {
      success: true,
      simulated: true,
      status: "system_dispatched",
      message: `System notification dispatched to ${toPhone}`,
      targetPhone: toPhone,
    };
  }

  try {
    console.log(`[WhatsApp Gateway] 📤 Sending to ${targetJid}: "${message}"`);
    const sentMsg = await sock.sendMessage(targetJid, { text: message });
    console.log(`[WhatsApp Gateway] ✅ Delivered! ID: ${sentMsg?.key?.id}`);
    return {
      success: true,
      messageId: sentMsg?.key?.id,
      targetJid,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`[WhatsApp Gateway] ❌ Send failed for ${targetJid}:`, error);
    return {
      success: false,
      error: error.message,
      targetJid,
    };
  }
};

export const getWhatsAppStatus = () => {
  return {
    status: connectionStatus,
    connectedNumber,
    hasQr: !!qrCodeData,
    qrCode: qrCodeData,
    pairingCode,
    senderNumber: "252616408886",
  };
};

/**
 * Disconnect / Logout
 */
export const logoutWhatsApp = async () => {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch (e) {}
  try {
    fs.rmSync(authDir, { recursive: true, force: true });
  } catch (e) {}
  connectionStatus = "disconnected";
  qrCodeData = null;
  pairingCode = null;
  connectedNumber = null;
  setTimeout(() => initWhatsApp(true), 1500);
  return { success: true };
};
