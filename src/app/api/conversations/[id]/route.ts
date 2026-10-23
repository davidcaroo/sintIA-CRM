import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        contact: {
          include: { appointments: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversación no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error al obtener conversación individual:", error);
    return NextResponse.json({ error: "Error al cargar la conversación." }, { status: 500 });
  }
}
