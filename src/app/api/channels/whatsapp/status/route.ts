import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await db.channelState.findUnique({
      where: { id: "whatsapp" },
    });

    return NextResponse.json({
      status: state?.status || "disconnected",
      qrCode: state?.qrCode || null,
      connectedNumber: state?.connectedNumber || null,
      connectedName: state?.connectedName || null,
      updatedAt: state?.updatedAt || new Date(),
    });
  } catch (error: any) {
    console.error("Error al obtener estado de WhatsApp:", error);
    return NextResponse.json({ error: "Error al consultar estado." }, { status: 500 });
  }
}
