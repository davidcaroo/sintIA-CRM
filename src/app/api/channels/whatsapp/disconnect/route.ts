import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const sessionDir = path.resolve(
      process.cwd(),
      process.env.WHATSAPP_SESSION_DIR || "./whatsapp-session"
    );

    // Limpiar base de datos
    await db.channelState.update({
      where: { id: "whatsapp" },
      data: {
        status: "disconnected",
        qrCode: null,
        connectedNumber: null,
        connectedName: null,
      },
    });

    // Purgar carpeta de sesión
    try {
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn("Aviso al borrar sesión WhatsApp:", e);
    }

    await db.activityLog.create({
      data: {
        action: "whatsapp_disconnected",
        channel: "whatsapp",
        details: "Sesión de WhatsApp desconectada por el administrador.",
        status: "warning",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error desconectando WhatsApp:", error);
    return NextResponse.json({ error: error.message || "Error al desconectar." }, { status: 500 });
  }
}
