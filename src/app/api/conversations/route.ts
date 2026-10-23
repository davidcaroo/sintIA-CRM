import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    let whereClause: any = {};

    if (filter === "handoff") {
      whereClause.status = "human_handoff";
    } else if (filter === "whatsapp") {
      whereClause.channel = "whatsapp";
    } else if (filter === "web") {
      whereClause.channel = "web";
    }

    const conversations = await db.conversation.findMany({
      where: whereClause,
      include: {
        contact: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    return NextResponse.json({ error: "Error al cargar conversaciones." }, { status: 500 });
  }
}
