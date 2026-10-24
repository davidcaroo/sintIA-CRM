import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getWhatsAppCreds, unregisterWebhook } from "@/lib/whatsapp/cloud";

/** Quita el webhook del número (si es el nuestro) y borra las credenciales. Las conversaciones se conservan. */
export async function POST() {
  try {
    const creds = await getWhatsAppCreds();
    if (creds) await unregisterWebhook(creds);

    await db.channelState.upsert({
      where: { id: "whatsapp" },
      update: { status: "disconnected", qrCode: null, encryptedCredentials: null, connectedNumber: null, connectedName: null },
      create: { id: "whatsapp", status: "disconnected" },
    });

    await db.activityLog.create({
      data: {
        action: "whatsapp_disconnected",
        channel: "whatsapp",
        details: "Número de WhatsApp Cloud API desconectado por el administrador.",
        status: "warning",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error desconectando WhatsApp:", error);
    return NextResponse.json({ error: error.message || "Error al desconectar." }, { status: 500 });
  }
}
