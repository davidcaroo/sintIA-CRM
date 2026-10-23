import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runAssistantConversation } from "@/lib/ai/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, contactName, contactPhone } = await req.json();

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Mensaje vacío." }, { status: 400 });
    }

    // 1. Comprobar si el asistente está encendido
    const config = await db.assistantConfig.findFirst();
    if (config && !config.isActive) {
      return NextResponse.json({
        reply: "El asistente se encuentra temporalmente en pausa. Por favor, contáctanos por teléfono.",
      });
    }

    // 2. Localizar o crear contacto
    const phoneIdentifier = contactPhone || `web-${sessionId || "anon"}`;
    const contact = await db.contact.upsert({
      where: { phone: phoneIdentifier },
      update: {
        name: contactName || undefined,
      },
      create: {
        phone: phoneIdentifier,
        name: contactName || "Visitante Web",
        channel: "web",
      },
    });

    // 3. Localizar o crear conversación
    let conversation = await db.conversation.findFirst({
      where: { contactId: contact.id, channel: "web" },
      orderBy: { updatedAt: "desc" },
      include: { messages: { take: 10, orderBy: { createdAt: "asc" } } },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          contactId: contact.id,
          channel: "web",
          status: "bot",
          lastMessageAt: new Date(),
        },
        include: { messages: true },
      });
    }

    // Si ha sido tomada por una persona humana
    if (conversation.status === "human_handoff") {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          sender: "client",
          text: message,
        },
      });
      return NextResponse.json({
        reply: "Un miembro de nuestro equipo ha tomado el control de esta conversación y te responderá en breve.",
        conversationId: conversation.id,
      });
    }

    // Guardar mensaje entrante del cliente
    await db.message.create({
      data: {
        conversationId: conversation.id,
        sender: "client",
        text: message,
      },
    });

    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Historial
    const history = (conversation.messages || []).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    // Ejecutar asistente
    const aiResponse = await runAssistantConversation(message, history, {
      isSafeMode: false,
      customerName: contact.name || undefined,
      customerPhone: contact.phone || undefined,
      channel: "web",
      conversationId: conversation.id,
    });

    // Guardar respuesta del asistente
    await db.message.create({
      data: {
        conversationId: conversation.id,
        sender: "assistant",
        text: aiResponse.reply,
        toolsUsed: aiResponse.toolsUsed,
      },
    });

    // Comprobar handoff
    const hasHandoff = aiResponse.timeline.some((t) => t.toolName === "pasar_a_humano");
    if (hasHandoff) {
      await db.conversation.update({
        where: { id: conversation.id },
        data: {
          status: "human_handoff",
          handoffReason: "Activado por herramienta pasar_a_humano",
        },
      });
    }

    return NextResponse.json({
      reply: aiResponse.reply,
      conversationId: conversation.id,
      toolsUsed: aiResponse.toolsUsed,
    });
  } catch (error: any) {
    console.error("Error en chat API:", error);
    return NextResponse.json({ error: error.message || "Error al procesar mensaje." }, { status: 500 });
  }
}
