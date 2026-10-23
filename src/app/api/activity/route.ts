import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const integrationId = searchParams.get("integrationId");
    const status = searchParams.get("status");

    let whereClause: any = {};
    if (integrationId && integrationId !== "all") {
      whereClause.integrationId = integrationId;
    }
    if (status && status !== "all") {
      whereClause.status = status;
    }

    const logs = await db.activityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error al obtener actividad:", error);
    return NextResponse.json({ error: "Error al cargar logs de actividad." }, { status: 500 });
  }
}
