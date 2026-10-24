import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import pino from "pino";
import { db } from "../src/lib/db";
import { runAssistantConversation } from "../src/lib/ai/openrouter";
import { emitEvent } from "../src/lib/events/bus";

// Importación dinámica de Baileys
let makeWASocket: any;
let DisconnectReason: any;
let useMultiFileAuthState: any;
let fetchLatestBaileysVersion: any;

const logger = pino({ level: "silent" });

interface MessageBufferItem {
  jid: string;
  senderPhone: string;
  senderName: string;
  whatsappLid?: string;
  texts: string[];
  timer: NodeJS.Timeout;
}

const messageBuffers = new Map<string, MessageBufferItem>();
const DEBOUNCE_DELAY_MS = 3500; // 3.5 segundos de espera para agrupar mensajes antes de redactar

/**
 * Simula el estado natural de "escribiendo..." en WhatsApp para que el cliente
 * visualice en la barra superior del chat la animación 'escribiendo...' antes del envío.
 */
async function simulateTypingAndSend(sock: any, jid: string, text: string) {
  try {
    await sock.presenceSubscribe(jid);
    await sock.sendPresenceUpdate("composing", jid);
  } catch {}

  // Duración orgánica de digitación (~22ms por carácter, mín 2 seg, máx 4.5 seg)
  const typingDurationMs = Math.min(Math.max(text.length * 22, 2000), 4500);

  // Mantener el estado "composing" fresco cada 1.8 segundos
  const interval = setInterval(async () => {
    try {
      await sock.sendPresenceUpdate("composing", jid);
    } catch {}
  }, 1800);

  await new Promise((resolve) => setTimeout(resolve, typingDurationMs));
  clearInterval(interval);

  // Despachar mensaje por WhatsApp
  await sock.sendMessage(jid, { text });

  // Detener estado de escritura
  try {
    await sock.sendPresenceUpdate("paused", jid);
  } catch {}
}

export async function initWhatsAppWorker() {
  console.log("📱 [WhatsApp-Worker] Cargando motor Baileys...");

  const baileys = await import("@whiskeysockets/baileys");
  makeWASocket = baileys.default;
  DisconnectReason = baileys.DisconnectReason;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;

  const sessionDir = path.resolve(
    process.cwd(),
    process.env.WHATSAPP_SESSION_DIR || "./whatsapp-session"
  );

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  console.log(`📱 [WhatsApp-Worker] Versión de Baileys: ${version.join(".")}`);

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: ["Sintia", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  // Monitor de conexión y emisión de QR
  sock.ev.on("connection.update", async (update: any) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("📷 [WhatsApp-Worker] Nuevo código QR generado.");
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
        await db.channelState.upsert({
          where: { id: "whatsapp" },
          update: {
            status: "waiting_qr",
            qrCode: qrDataUrl,
          },
          create: {
            id: "whatsapp",
            isActive: true,
            status: "waiting_qr",
            qrCode: qrDataUrl,
          },
        });
      } catch (err) {
        console.error("Error generando QR DataURL:", err);
      }
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`⚠️ [WhatsApp-Worker] Conexión cerrada (código: ${statusCode}). Reconectando: ${shouldReconnect}`);

      await db.channelState.upsert({
        where: { id: "whatsapp" },
        update: {
          status: "disconnected",
          qrCode: null,
        },
        create: {
          id: "whatsapp",
          isActive: true,
          status: "disconnected",
        },
      });

      if (shouldReconnect) {
        // En WhatsApp Multi-Device, el código 515 o desconexiones temporales son normales tras el handshake inicial
        console.log("🔄 [WhatsApp-Worker] Reiniciando socket para sincronización final...");
        setTimeout(initWhatsAppWorker, 2000);
      } else {
        // Sesión cerrada / logout: limpiar carpeta para permitir nuevo escaneo
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch {}
        setTimeout(initWhatsAppWorker, 3000);
      }
    } else if (connection === "open") {
      const phoneNumber = sock.user?.id ? sock.user.id.split(":")[0] : "Desconocido";
      const userName = sock.user?.name || "Clínica Dental Lumen";

      console.log(`✅ [WhatsApp-Worker] Conectado exitosamente con el número +${phoneNumber} (${userName})`);

      await db.channelState.upsert({
        where: { id: "whatsapp" },
        update: {
          status: "connected",
          qrCode: null,
          connectedNumber: `+${phoneNumber}`,
          connectedName: userName,
        },
        create: {
          id: "whatsapp",
          isActive: true,
          status: "connected",
          connectedNumber: `+${phoneNumber}`,
          connectedName: userName,
        },
      });

      await db.activityLog.create({
        data: {
          action: "whatsapp_connected",
          channel: "whatsapp",
          details: `WhatsApp vinculado con el número +${phoneNumber}.`,
          status: "success",
        },
      });
    }
  });

  // Escuchar mensajes entrantes
  sock.ev.on("messages.upsert", async ({ messages, type }: any) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message) continue;
      // 1. Ignorar mensajes propios
      if (msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid || "";

      // 2. Ignorar grupos y estados de difusión
      if (remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") {
        continue;
      }

      // Extraer identificadores: teléfono y LID
      const senderPhone = `+${remoteJid.split("@")[0]}`;
      const whatsappLid = msg.key.participant || (remoteJid.endsWith("@lid") ? remoteJid : undefined);
      const pushName = msg.pushName || "Cliente WhatsApp";

      // Detectar audios o imágenes
      const isMedia = msg.message.audioMessage || msg.message.imageMessage || msg.message.videoMessage;
      if (isMedia) {
        console.log(`📎 [WhatsApp-Worker] Mensaje multimedia recibido de ${senderPhone}. Solicitando texto...`);

        // Registrar o actualizar contacto y conversación
        const contact = await db.contact.upsert({
          where: { phone: senderPhone },
          update: { name: pushName, whatsappLid },
          create: { name: pushName, phone: senderPhone, channel: "whatsapp", whatsappLid },
        });

        const conv = await db.conversation.create({
          data: {
            contactId: contact.id,
            channel: "whatsapp",
            status: "human_handoff",
            handoffReason: "Cliente envió audio o imagen",
            lastMessageAt: new Date(),
          },
        });

        await db.message.create({
          data: {
            conversationId: conv.id,
            sender: "client",
            text: "[Archivo multimedia: Audio o Imagen]",
          },
        });

        const audioNotice =
          "He recibido tu audio o imagen, pero por el momento solo puedo leer mensajes de texto. Por favor, escríbeme lo que necesitas en texto para poder atenderte enseguida.";

        await simulateTypingAndSend(sock, remoteJid, audioNotice);

        await db.message.create({
          data: {
            conversationId: conv.id,
            sender: "assistant",
            text: audioNotice,
          },
        });

        continue;
      }

      // Extraer texto
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (!text.trim()) continue;

      console.log(`💬 [WhatsApp-Worker] Mensaje de ${senderPhone}: "${text}"`);

      // 3. Manejo del búfer de 8 segundos para mensajes consecutivos
      if (messageBuffers.has(remoteJid)) {
        const item = messageBuffers.get(remoteJid)!;
        clearTimeout(item.timer);
        item.texts.push(text);
        item.timer = setTimeout(() => processBufferedMessages(sock, remoteJid), DEBOUNCE_DELAY_MS);
      } else {
        const timer = setTimeout(() => processBufferedMessages(sock, remoteJid), DEBOUNCE_DELAY_MS);
        messageBuffers.set(remoteJid, {
          jid: remoteJid,
          senderPhone,
          senderName: pushName,
          whatsappLid,
          texts: [text],
          timer,
        });
      }
    }
  });

  return sock;
}

/**
 * Procesa los mensajes acumulados de un cliente tras 8 segundos de silencio
 */
async function processBufferedMessages(sock: any, jid: string) {
  const item = messageBuffers.get(jid);
  if (!item) return;
  messageBuffers.delete(jid);

  const combinedText = item.texts.join("\n");
  console.log(`⏳ [WhatsApp-Worker] Procesando buffer agrupado de ${item.senderPhone} (${item.texts.length} msgs): "${combinedText}"`);

  // 1. Comprobar si el asistente general está encendido
  const config = await db.assistantConfig.findFirst();
  if (config && !config.isActive) {
    console.log("⏸️ [WhatsApp-Worker] Asistente en pausa general. No se emite respuesta automática.");
    return;
  }

  // 2. Obtener o crear contacto
  const contact = await db.contact.upsert({
    where: { phone: item.senderPhone },
    update: {
      name: item.senderName,
      whatsappLid: item.whatsappLid,
    },
    create: {
      phone: item.senderPhone,
      name: item.senderName,
      channel: "whatsapp",
      whatsappLid: item.whatsappLid,
    },
  });

  // 3. Obtener o crear conversación
  let conversation = await db.conversation.findFirst({
    where: { contactId: contact.id, channel: "whatsapp" },
    orderBy: { updatedAt: "desc" },
    include: { messages: { take: 10, orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        contactId: contact.id,
        channel: "whatsapp",
        status: "bot",
        lastMessageAt: new Date(),
      },
      include: { messages: true },
    });
  }

  // Si la conversación ha sido tomada por una persona humana, el asistente se calla
  if (conversation.status === "human_handoff") {
    console.log(`👤 [WhatsApp-Worker] Conversación de ${item.senderPhone} está en mano humana. Bot silenciado.`);
    // Guardar el mensaje del cliente para que la persona lo vea en el panel
    const clientMsg = await db.message.create({
      data: {
        conversationId: conversation.id,
        sender: "client",
        text: combinedText,
      },
    });

    emitEvent({
      type: "message:new",
      data: {
        conversationId: conversation.id,
        message: {
          id: clientMsg.id,
          sender: "client",
          text: clientMsg.text,
          createdAt: clientMsg.createdAt.toISOString(),
        },
      },
    });

    emitEvent({
      type: "conversation:updated",
      data: {
        conversationId: conversation.id,
        lastMessageAt: clientMsg.createdAt.toISOString(),
        previewText: clientMsg.text,
      },
    });
    return;
  }

  // Guardar mensaje entrante del cliente en DB
  const clientMsg = await db.message.create({
    data: {
      conversationId: conversation.id,
      sender: "client",
      text: combinedText,
    },
  });

  await db.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  emitEvent({
    type: "message:new",
    data: {
      conversationId: conversation.id,
      message: {
        id: clientMsg.id,
        sender: "client",
        text: clientMsg.text,
        createdAt: clientMsg.createdAt.toISOString(),
      },
    },
  });

  emitEvent({
    type: "conversation:updated",
    data: {
      conversationId: conversation.id,
      lastMessageAt: clientMsg.createdAt.toISOString(),
      previewText: clientMsg.text,
    },
  });

  // 4. Mostrar estado "escribiendo..." en WhatsApp antes de responder
  try {
    await sock.sendPresenceUpdate("composing", jid);
  } catch (e) {
    // Ignorar si el presence falla
  }

  // 5. Historial previo formateado
  const history = (conversation.messages || []).map((m) => ({
    sender: m.sender,
    text: m.text,
  }));

  // 6. Invocar motor de IA del asistente
  try {
    const aiResponse = await runAssistantConversation(combinedText, history, {
      isSafeMode: false, // En WhatsApp productivo ejecuta acciones reales
      customerName: contact.name || undefined,
      customerPhone: contact.phone || undefined,
      channel: "whatsapp",
      conversationId: conversation.id,
    });

    // 7. Simular animación "escribiendo..." en WhatsApp y enviar respuesta
    await simulateTypingAndSend(sock, jid, aiResponse.reply);

    // 8. Guardar mensaje del asistente en DB con herramientas utilizadas
    const assistantMsg = await db.message.create({
      data: {
        conversationId: conversation.id,
        sender: "assistant",
        text: aiResponse.reply,
        toolsUsed: aiResponse.toolsUsed,
      },
    });

    emitEvent({
      type: "message:new",
      data: {
        conversationId: conversation.id,
        message: {
          id: assistantMsg.id,
          sender: "assistant",
          text: assistantMsg.text,
          toolsUsed: assistantMsg.toolsUsed,
          createdAt: assistantMsg.createdAt.toISOString(),
        },
      },
    });

    emitEvent({
      type: "conversation:updated",
      data: {
        conversationId: conversation.id,
        lastMessageAt: assistantMsg.createdAt.toISOString(),
        previewText: assistantMsg.text,
      },
    });

    // Si una de las herramientas fue pasar_a_humano, actualizar estado de la conversación
    const hasHandoff = aiResponse.timeline.some((t) => t.toolName === "pasar_a_humano");
    if (hasHandoff) {
      await db.conversation.update({
        where: { id: conversation.id },
        data: {
          status: "human_handoff",
          handoffReason: "Activado por herramienta pasar_a_humano",
        },
      });

      emitEvent({
        type: "conversation:takeover",
        data: {
          conversationId: conversation.id,
          status: "human",
        },
      });
      console.log(`🚨 [WhatsApp-Worker] Conversación ${conversation.id} transferida a humano.`);
    }
  } catch (err: any) {
    console.error("❌ [WhatsApp-Worker] Error respondiendo con IA:", err);
  }
}
