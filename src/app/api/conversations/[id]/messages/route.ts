import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events/bus";

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

    // 1. Guardar mensaje enviado por la persona humana del equipo
    const msg = await db.message.create({
      data: {
        conversationId: id,
        sender: "human",
        text: text.trim(),
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

    // 2. Si el canal es WhatsApp, intentar enviar vía Baileys si el socket está activo
    if (conversation.channel === "whatsapp" && conversation.contact?.phone) {
      try {
        const { getActiveWhatsAppSocket } = await import("../../../../../../worker/index");
        const sock = getActiveWhatsAppSocket();
        if (sock) {
          const rawPhone = conversation.contact.phone.replace(/[^0-9]/g, "");
          const jid = `${rawPhone}@s.whatsapp.net`;
          await sock.sendMessage(jid, { text: text.trim() });
        }
      } catch (waErr) {
        console.warn("Aviso: No se pudo despachar por WhatsApp socket:", waErr);
      }
    }

    return NextResponse.json({ success: true, message: msg });
  } catch (error) {
    console.error("Error al enviar mensaje desde el panel:", error);
    return NextResponse.json({ error: "Error al enviar mensaje." }, { status: 500 });
  }
}
