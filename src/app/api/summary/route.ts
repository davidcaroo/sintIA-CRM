import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [config, channels, integrations, conversations, appointments, activity] =
      await Promise.all([
        db.assistantConfig.findFirst(),
        db.channelState.findMany(),
        db.integration.findMany(),
        db.conversation.findMany({
          include: { contact: true, messages: { take: 1, orderBy: { createdAt: "desc" } } },
          orderBy: { lastMessageAt: "desc" },
        }),
        db.appointment.findMany({
          include: { contact: true },
          orderBy: { startTime: "asc" },
        }),
        db.activityLog.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
        }),
      ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const conversationsToday = conversations.filter((c) => new Date(c.createdAt) >= today).length;
    const pendingHandoff = conversations.filter((c) => c.status === "human_handoff").length;
    const appointmentsCreated = appointments.length;

    return NextResponse.json({
      isActive: config?.isActive ?? true,
      channels,
      integrations,
      stats: {
        conversationsToday,
        conversationsTotal: conversations.length,
        appointmentsCreated,
        pendingHandoff,
        avgResponseTime: "2.4s",
      },
      recentActivity: activity,
      recentConversations: conversations.slice(0, 5),
    });
  } catch (error) {
    console.error("Error en resumen API:", error);
    return NextResponse.json({ error: "Error al cargar datos del resumen." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isActive } = await req.json();
    const updated = await db.assistantConfig.updateMany({
      data: { isActive },
    });
    return NextResponse.json({ success: true, isActive });
  } catch (error) {
    console.error("Error al alternar estado del asistente:", error);
    return NextResponse.json({ error: "Error al actualizar estado." }, { status: 500 });
  }
}
