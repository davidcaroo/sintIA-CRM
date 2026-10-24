import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events/bus";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await req.json(); // "takeover" (human) o "release" (bot)

    const newStatus = action === "takeover" ? "human_handoff" : "bot";

    const updated = await db.conversation.update({
      where: { id },
      data: {
        status: newStatus,
        handoffReason: action === "takeover" ? "Control tomado manualmente desde el panel" : null,
      },
      include: { contact: true },
    });

    emitEvent({
      type: "conversation:takeover",
      data: {
        conversationId: id,
        status: action === "takeover" ? "human" : "bot",
      },
    });

    emitEvent({
      type: "conversation:updated",
      data: {
        conversationId: id,
        lastMessageAt: updated.lastMessageAt.toISOString(),
        status: newStatus,
      },
    });

    await db.activityLog.create({
      data: {
        action: action === "takeover" ? "human_takeover" : "assistant_resumed",
        channel: updated.channel,
        details:
          action === "takeover"
            ? `Un miembro del equipo tomó el control de la conversación con ${updated.contact?.name || updated.contact?.phone}.`
            : `Conversación devuelta al asistente Sintia.`,
        status: "success",
      },
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error) {
    console.error("Error en takeover:", error);
    return NextResponse.json({ error: "Error al cambiar control de la conversación." }, { status: 500 });
  }
}
