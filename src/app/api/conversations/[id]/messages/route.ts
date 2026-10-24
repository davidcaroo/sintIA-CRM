import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events/bus";
import { isWindowOpen, metaErrorMessage, sendWhatsAppText } from "@/lib/whatsapp/cloud";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { text } = await req.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Mensaje vacío." }, { status: 400 });
    }

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversación no encontrada." }, { status: 404 });
    }

    // 1. WhatsApp Cloud API: enviar ANTES de guardar, para no mostrar en el panel un mensaje que no salió
    let channelMsgId: string | null = null;
    if (conversation.channel === "whatsapp" && conversation.contact?.phone) {
      const lastInbound = await db.message.findFirst({
        where: { conversationId: id, sender: "client" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      if (!isWindowOpen(lastInbound?.createdAt)) {
        return NextResponse.json(
          { error: "Pasaron más de 24 h desde el último mensaje del cliente. WhatsApp solo permite escribirle con una plantilla aprobada." },
          { status: 422 }
        );
      }
      try {
        channelMsgId = await sendWhatsAppText(conversation.contact.phone, text.trim());
      } catch (waErr) {
        return NextResponse.json({ error: metaErrorMessage(waErr) }, { status: 422 });
      }
    }

    const msg = await db.message.create({
      data: {
        conversationId: id,
        sender: "human",
        text: text.trim(),
        channelMsgId,
        status: channelMsgId ? "sent" : null,
      },
    });

    await db.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    // Notificar en tiempo real por SSE
    emitEvent({
      type: "message:new",
      data: {
        conversationId: id,
        message: {
          id: msg.id,
          sender: "human",
          text: msg.text,
          createdAt: msg.createdAt.toISOString(),
        },
      },
    });

    emitEvent({
      type: "conversation:updated",
      data: {
        conversationId: id,
        lastMessageAt: msg.createdAt.toISOString(),
        previewText: msg.text,
      },
    });

    return NextResponse.json({ success: true, message: msg });
  } catch (error) {
    console.error("Error al enviar mensaje desde el panel:", error);
    return NextResponse.json({ error: "Error al enviar mensaje." }, { status: 500 });
  }
}
