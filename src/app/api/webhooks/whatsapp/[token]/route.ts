import { db } from "@/lib/db";
import { isValidSignature, parseWebhook, safeEqual, STATUS_RANK, webhookVerifyToken } from "@/lib/whatsapp/cloud";

/**
 * Webhook público de WhatsApp Cloud API.
 * Capa 1: el segmento [token] debe coincidir con el verify token (si no → 404).
 * Capa 2: firma x-hub-signature-256 si META_APP_SECRET está configurado.
 * Los mensajes se guardan en WhatsAppInbound ANTES de responder 200; el worker los procesa.
 * Si la base no responde → 503 y Meta reintenta. El wamid como id deduplica los reintentos.
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  const { token } = await params;
  const verify = webhookVerifyToken();
  if (!safeEqual(token, verify)) return new Response(null, { status: 404 });

  const url = new URL(req.url);
  if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === verify) {
    return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response(null, { status: 403 });
}

export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  if (!safeEqual(token, webhookVerifyToken())) return new Response(null, { status: 404 });

  const rawBody = await req.text();
  if (!isValidSignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return new Response(null, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ received: true }); // ilegible: 200 para que Meta no reintente basura
  }

  const { messages, statuses } = parseWebhook(payload);

  try {
    if (messages.length) {
      await db.whatsAppInbound.createMany({ data: messages, skipDuplicates: true });
    }

    // Estados de los mensajes salientes: solo avanzan (sent → delivered → read); failed siempre gana
    for (const st of statuses) {
      const lower = Object.keys(STATUS_RANK).filter((k) => STATUS_RANK[k] < STATUS_RANK[st.status]);
      const { count } = await db.message.updateMany({
        where: { channelMsgId: st.id, OR: [{ status: null }, { status: { in: lower } }] },
        data: { status: st.status, ...(st.status === "failed" ? { error: st.error } : {}) },
      });
      if (st.status === "failed" && count > 0) {
        await db.activityLog.create({
          data: {
            action: "whatsapp_send_failed",
            channel: "whatsapp",
            details: `Meta no entregó un mensaje a +${st.recipient}.`,
            status: "error",
            error: st.error,
            metadata: { wamid: st.id },
          },
        });
      }
    }
  } catch (err) {
    console.error("[webhook-whatsapp] no se pudo guardar el evento; 503 para que Meta reintente:", err);
    return Response.json({ received: false }, { status: 503 });
  }

  return Response.json({ received: true });
}
