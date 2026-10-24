import { db } from "../src/lib/db";
import { runAssistantConversation } from "../src/lib/ai/openrouter";
import { emitEvent } from "../src/lib/events/bus";
import { getWhatsAppCreds, markReadAndTyping, metaErrorMessage, sendWhatsAppText } from "../src/lib/whatsapp/cloud";

/**
 * Worker de WhatsApp Cloud API.
 * El webhook (proceso web) guarda cada mensaje en WhatsAppInbound; aquí se leen,
 * se agrupan por cliente con un debounce y se responde con la IA.
 * Un mensaje solo se marca procesado cuando su ráfaga terminó: si el worker se
 * reinicia a mitad, se vuelve a procesar al arrancar.
 */

const POLL_MS = 1000;
const DEBOUNCE_DELAY_MS = 3500; // silencio que se espera antes de responder a una ráfaga

const MEDIA_NOTICE =
  "He recibido tu archivo, pero por el momento solo puedo leer mensajes de texto. Por favor, escríbeme lo que necesitas para poder atenderte enseguida.";

interface Buffer {
  waId: string;
  name: string | null;
  ids: string[];
  texts: string[];
  lastWamid: string;
  hasMedia: boolean;
  timer: NodeJS.Timeout;
}

const buffers = new Map<string, Buffer>();
const inFlight = new Set<string>();
let polling = false;

export function initWhatsAppWorker() {
  console.log("📱 [WhatsApp-Worker] Cloud API de Meta: escuchando mensajes del webhook.");
  setInterval(poll, POLL_MS);
}

async function poll() {
  if (polling) return;
  polling = true;
  try {
    const rows = await db.whatsAppInbound.findMany({
      where: { processedAt: null, id: { notIn: [...inFlight] } },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    for (const row of rows) {
      inFlight.add(row.id);
      const isMedia = !row.text.trim() && row.type !== "text";
      const text = row.text.trim() || (isMedia ? `[Archivo multimedia: ${row.type}]` : "");
      if (!text) {
        await finish([row.id]);
        continue;
      }
      console.log(`💬 [WhatsApp-Worker] Mensaje de +${row.waId}: "${text}"`);

      const item = buffers.get(row.waId);
      if (item) {
        clearTimeout(item.timer);
        item.ids.push(row.id);
        item.texts.push(text);
        item.lastWamid = row.id;
        item.hasMedia ||= isMedia;
        item.name = row.name ?? item.name;
        item.timer = setTimeout(() => flush(row.waId), DEBOUNCE_DELAY_MS);
      } else {
        buffers.set(row.waId, {
          waId: row.waId,
          name: row.name,
          ids: [row.id],
          texts: [text],
          lastWamid: row.id,
          hasMedia: isMedia,
          timer: setTimeout(() => flush(row.waId), DEBOUNCE_DELAY_MS),
        });
      }
    }
  } catch (err) {
    console.error("❌ [WhatsApp-Worker] Error leyendo mensajes entrantes:", err);
  } finally {
    polling = false;
  }
}

async function finish(ids: string[]) {
  try {
    await db.whatsAppInbound.updateMany({ where: { id: { in: ids } }, data: { processedAt: new Date() } });
  } finally {
    ids.forEach((id) => inFlight.delete(id));
  }
}

async function flush(waId: string) {
  const item = buffers.get(waId);
  if (!item) return;
  buffers.delete(waId);
  try {
    await processBurst(item);
  } catch (err) {
    console.error(`❌ [WhatsApp-Worker] Error procesando ráfaga de +${waId}:`, err);
  } finally {
    await finish(item.ids);
  }
}

function emitMessage(conversationId: string, msg: { id: string; sender: string; text: string; toolsUsed?: any; createdAt: Date }) {
  emitEvent({
    type: "message:new",
    data: { conversationId, message: { ...msg, createdAt: msg.createdAt.toISOString() } },
  });
  emitEvent({
    type: "conversation:updated",
    data: { conversationId, lastMessageAt: msg.createdAt.toISOString(), previewText: msg.text },
  });
}

async function processBurst(item: Buffer) {
  const phone = `+${item.waId}`;
  const combinedText = item.texts.join("\n");
  console.log(`⏳ [WhatsApp-Worker] Procesando ráfaga de ${phone} (${item.texts.length} msgs)`);

  const creds = await getWhatsAppCreds();

  // 1. Contacto y conversación (siempre se guarda lo que escribió el cliente)
  const contact = await db.contact.upsert({
    where: { phone },
    update: item.name ? { name: item.name } : {},
    create: { phone, name: item.name || "Cliente WhatsApp", channel: "whatsapp" },
  });

  let conversation = await db.conversation.findFirst({
    where: { contactId: contact.id, channel: "whatsapp", status: { not: "closed" } },
    orderBy: { updatedAt: "desc" },
  });
  if (!conversation) {
    conversation = await db.conversation.create({
      data: { contactId: contact.id, channel: "whatsapp", status: "bot", lastMessageAt: new Date() },
    });
  }

  // Historial: los ÚLTIMOS 10 mensajes, en orden cronológico
  const history = (
    await db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
  )
    .reverse()
    .map((m) => ({ sender: m.sender, text: m.text }));

  const clientMsg = await db.message.create({
    data: { conversationId: conversation.id, sender: "client", text: combinedText, channelMsgId: item.lastWamid },
  });
  await db.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
  emitMessage(conversation.id, clientMsg);

  // 2. ¿Debe responder el bot?
  const config = await db.assistantConfig.findFirst();
  if (config && !config.isActive) {
    console.log("⏸️ [WhatsApp-Worker] Asistente en pausa general. Mensaje guardado sin respuesta.");
    return;
  }
  if (conversation.status === "human_handoff") {
    console.log(`👤 [WhatsApp-Worker] Conversación de ${phone} en mano humana. Bot silenciado.`);
    return;
  }
  if (!creds) {
    console.warn("⚠️ [WhatsApp-Worker] WhatsApp no está conectado: no se puede responder.");
    return;
  }

  // 3. Leído + "escribiendo…" nativo de la Cloud API
  await markReadAndTyping(item.lastWamid, creds);

  // 4. Solo multimedia: aviso amable, sin pasar a humano (el bot sigue atendiendo)
  const onlyMedia = item.hasMedia && item.texts.every((t) => t.startsWith("[Archivo multimedia"));
  if (onlyMedia) {
    await sendAndStore(conversation.id, phone, MEDIA_NOTICE, creds);
    return;
  }

  // 5. IA
  const aiResponse = await runAssistantConversation(combinedText, history, {
    isSafeMode: false,
    customerName: contact.name || undefined,
    customerPhone: contact.phone || undefined,
    channel: "whatsapp",
    conversationId: conversation.id,
  });

  await sendAndStore(conversation.id, phone, aiResponse.reply, creds, aiResponse.toolsUsed);

  if (aiResponse.timeline.some((t) => t.toolName === "pasar_a_humano")) {
    await db.conversation.update({
      where: { id: conversation.id },
      data: { status: "human_handoff", handoffReason: "Activado por herramienta pasar_a_humano" },
    });
    emitEvent({ type: "conversation:takeover", data: { conversationId: conversation.id, status: "human" } });
    console.log(`🚨 [WhatsApp-Worker] Conversación ${conversation.id} transferida a humano.`);
  }
}

async function sendAndStore(conversationId: string, phone: string, text: string, creds: any, toolsUsed?: any) {
  let channelMsgId: string | null = null;
  try {
    channelMsgId = await sendWhatsAppText(phone, text, creds);
  } catch (err) {
    const message = metaErrorMessage(err);
    console.error(`❌ [WhatsApp-Worker] Meta rechazó la respuesta a ${phone}: ${message}`);
    await db.activityLog.create({
      data: { action: "whatsapp_send_failed", channel: "whatsapp", details: `No se pudo responder a ${phone}.`, status: "error", error: message },
    });
    return;
  }
  const msg = await db.message.create({
    data: { conversationId, sender: "assistant", text, toolsUsed, channelMsgId },
  });
  emitMessage(conversationId, msg);
}
