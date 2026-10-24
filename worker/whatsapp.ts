import { db } from "../src/lib/db";
import { runAssistantConversation } from "../src/lib/ai/openrouter";
import { emitEvent } from "../src/lib/events/bus";
import { getWhatsAppCreds, markReadAndTyping, metaErrorMessage, sendWhatsAppText, type WhatsAppCreds } from "../src/lib/whatsapp/cloud";
import { describeInbound, type InboundRow } from "../src/lib/whatsapp/media-ai";

/**
 * Worker de WhatsApp Cloud API.
 * El webhook (proceso web) guarda cada mensaje en WhatsAppInbound; aquí se leen,
 * se agrupan por cliente con un debounce, se convierten los adjuntos en texto
 * (transcripción, descripción, resumen) y se responde con la IA.
 * Un mensaje solo se marca procesado cuando su ráfaga terminó: si el worker se
 * reinicia a mitad, se vuelve a procesar al arrancar.
 */

const POLL_MS = 1000;
const DEBOUNCE_DELAY_MS = 3500; // silencio que se espera antes de responder a una ráfaga
const MEDIA_DEBOUNCE_MS = 6000; // tras un adjunto se espera algo más: suele llegar texto detrás

interface Burst {
  waId: string;
  name: string | null;
  rows: InboundRow[];
  timer: NodeJS.Timeout;
}

const bursts = new Map<string, Burst>();
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
      if (!row.text.trim() && !row.mediaId) {
        await finish([row.id]); // reacciones, mensajes no soportados
        continue;
      }
      console.log(`💬 [WhatsApp-Worker] ${row.type} de +${row.waId}${row.text ? `: "${row.text}"` : ""}`);
      const delay = row.mediaId ? MEDIA_DEBOUNCE_MS : DEBOUNCE_DELAY_MS;
      const burst = bursts.get(row.waId);
      if (burst) {
        clearTimeout(burst.timer);
        burst.rows.push(row);
        burst.name = row.name ?? burst.name;
        burst.timer = setTimeout(() => flush(row.waId), delay);
      } else {
        bursts.set(row.waId, { waId: row.waId, name: row.name, rows: [row], timer: setTimeout(() => flush(row.waId), delay) });
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
  const burst = bursts.get(waId);
  if (!burst) return;
  bursts.delete(waId);
  try {
    await processBurst(burst);
  } catch (err) {
    console.error(`❌ [WhatsApp-Worker] Error procesando ráfaga de +${waId}:`, err);
  } finally {
    await finish(burst.rows.map((r) => r.id));
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

async function processBurst(burst: Burst) {
  const phone = `+${burst.waId}`;
  const creds = await getWhatsAppCreds();
  const lastWamid = burst.rows[burst.rows.length - 1].id;

  // 1. Contacto y conversación
  const contact = await db.contact.upsert({
    where: { phone },
    update: burst.name ? { name: burst.name } : {},
    create: { phone, name: burst.name || "Cliente WhatsApp", channel: "whatsapp" },
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

  // Historial previo: los ÚLTIMOS 10 mensajes, en orden cronológico
  const history = (
    await db.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "desc" }, take: 10 })
  )
    .reverse()
    .map((m) => ({ sender: m.sender, text: m.text }));

  const config = await db.assistantConfig.findFirst();
  const botWillReply = !(config && !config.isActive) && conversation.status !== "human_handoff" && !!creds;

  // "Leído + escribiendo…" mientras se transcriben adjuntos y piensa la IA
  if (botWillReply) await markReadAndTyping(lastWamid, creds);

  // 2. Adjuntos → texto (en paralelo). Se procesan aunque responda una persona: así lo lee el equipo.
  const described = await Promise.all(burst.rows.map((r) => describeInbound(r, creds)));

  // 3. Un mensaje en la bandeja por cada entrada del cliente
  for (let i = 0; i < burst.rows.length; i++) {
    const row = burst.rows[i];
    const msg = await db.message.create({
      data: {
        conversationId: conversation.id,
        sender: "client",
        text: described[i].display || row.text || `[${row.type}]`,
        channelMsgId: row.id,
        mediaType: row.mediaId ? row.type : null,
        mediaId: row.mediaId,
        mediaMime: row.mime,
      },
    });
    emitMessage(conversation.id, msg);
  }
  await db.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });

  // 4. ¿Debe responder el bot?
  if (config && !config.isActive) return console.log("⏸️ [WhatsApp-Worker] Asistente en pausa general. Mensaje guardado sin respuesta.");
  if (conversation.status === "human_handoff") return console.log(`👤 [WhatsApp-Worker] ${phone} en mano humana. Bot silenciado.`);
  if (!creds) return console.warn("⚠️ [WhatsApp-Worker] WhatsApp no está conectado: no se puede responder.");

  const forAi = described.map((d) => d.forAi).filter(Boolean).join("\n");
  if (!forAi) return; // solo stickers o reacciones: no hace falta contestar

  // 5. IA
  const aiResponse = await runAssistantConversation(forAi, history, {
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

async function sendAndStore(conversationId: string, phone: string, text: string, creds: WhatsAppCreds, toolsUsed?: any) {
  let channelMsgId: string | null = null;
  let error: string | null = null;
  try {
    channelMsgId = await sendWhatsAppText(phone, text, creds);
  } catch (err) {
    error = metaErrorMessage(err);
    console.error(`❌ [WhatsApp-Worker] Meta rechazó la respuesta a ${phone}: ${error}`);
    await db.activityLog.create({
      data: { action: "whatsapp_send_failed", channel: "whatsapp", details: `No se pudo responder a ${phone}.`, status: "error", error },
    });
  }
  // Se guarda también si falló, marcado como fallido: el equipo ve qué no le llegó al cliente
  const msg = await db.message.create({
    data: { conversationId, sender: "assistant", text, toolsUsed, channelMsgId, status: error ? "failed" : "sent", error },
  });
  emitMessage(conversationId, msg);
}
