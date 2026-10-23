import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.integration.update({
      where: { id },
      data: {
        isConnected: false,
        status: "disconnected",
        statusMessage: null,
        encryptedCredentials: null,
      },
    });

    await db.activityLog.create({
      data: {
        action: "integration_disconnected",
        integrationId: id,
        details: `Integración ${id} desconectada por el administrador.`,
        status: "warning",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al desconectar integración:", error);
    return NextResponse.json({ error: "Error al desconectar." }, { status: 500 });
  }
}
