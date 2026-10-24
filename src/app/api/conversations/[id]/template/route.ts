import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events/bus";
import {
  getWhatsAppCreds,
  listApprovedTemplates,
  metaErrorMessage,
  renderTemplate,
  sendWhatsAppTemplate,
} from "@/lib/whatsapp/cloud";

const schema = z.object({
  name: z.string().min(1),
  language: z.string().min(2),
  params: z.array(z.string().trim().min(1, "Completa todas las variables")).default([]),
});

/** Envía una plantilla aprobada: la única forma de escribir pasadas 24 h del último mensaje del cliente. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos." }, { status: 400 });
  const body = parsed.data;

  const conversation = await db.conversation.findUnique({ where: { id }, include: { contact: true } });
  if (!conversation) return NextResponse.json({ error: "Conversación no encontrada." }, { status: 404 });
  if (conversation.channel !== "whatsapp" || !conversation.contact?.phone) {
    return NextResponse.json({ error: "Las plantillas solo se envían por WhatsApp." }, { status: 400 });
  }

  const creds = await getWhatsAppCreds();
  if (!creds) return NextResponse.json({ error: "WhatsApp no está conectado." }, { status: 409 });

  let channelMsgId: string | null;
  let text: string;
  try {
    const template = (await listApprovedTemplates(creds)).find((t) => t.name === body.name && t.language === body.language);
    if (!template) return NextResponse.json({ error: "La plantilla no existe o ya no está aprobada." }, { status: 404 });
    if (!template.supported) return NextResponse.json({ error: "Esta plantilla requiere encabezado o botones con datos que el panel aún no rellena." }, { status: 422 });
    if (body.params.length !== template.params) {
      return NextResponse.json({ error: `La plantilla necesita ${template.params} variable(s).` }, { status: 400 });
    }
    channelMsgId = await sendWhatsAppTemplate(conversation.contact.phone, template.name, template.language, body.params, creds);
    text = renderTemplate(template.body, body.params);
  } catch (err) {
    return NextResponse.json({ error: metaErrorMessage(err) }, { status: 422 });
  }

  const msg = await db.message.create({
    data: {
      conversationId: id,
      sender: "human",
      text,
      channelMsgId,
      status: "sent",
      toolsUsed: [{ name: "plantilla", args: { name: body.name, language: body.language }, result: "Plantilla aprobada enviada" }],
    },
  });
  await db.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } });

  emitEvent({
    type: "message:new",
    data: { conversationId: id, message: { id: msg.id, sender: "human", text: msg.text, createdAt: msg.createdAt.toISOString() } },
  });
  emitEvent({ type: "conversation:updated", data: { conversationId: id, lastMessageAt: msg.createdAt.toISOString(), previewText: msg.text } });

  await db.activityLog.create({
    data: {
      action: "whatsapp_template_sent",
      channel: "whatsapp",
      details: `Plantilla «${body.name}» enviada a ${conversation.contact.name || conversation.contact.phone}.`,
      status: "success",
    },
  });

  return NextResponse.json({ success: true, message: msg });
}
