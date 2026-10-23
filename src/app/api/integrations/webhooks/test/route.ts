import { NextRequest, NextResponse } from "next/server";
import { dispatchWebhookEvent } from "@/lib/integrations/webhooks";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { destinationUrl, secret, events } = await req.json();

    if (destinationUrl) {
      await db.integration.upsert({
        where: { id: "webhooks" },
        update: {
          isConnected: true,
          status: "connected",
          statusMessage: "Webhook configurado",
          encryptedCredentials: secret ? encrypt(secret) : undefined,
          config: { destinationUrl, enabledEvents: events || [] },
        },
        create: {
          id: "webhooks",
          name: "Webhooks",
          category: "Automatizaciones",
          isConnected: true,
          status: "connected",
          statusMessage: "Webhook configurado",
          encryptedCredentials: secret ? encrypt(secret) : undefined,
          config: { destinationUrl, enabledEvents: events || [] },
        },
      });
    }

    const testPayload = {
      tipo: "prueba",
      mensaje: "Evento de prueba emitido desde Sintia para verificar la conexión.",
      negocio: "Clínica Dental Lumen",
      fecha: new Date().toISOString(),
    };

    const res = await dispatchWebhookEvent("test.event", testPayload);

    return NextResponse.json({ success: true, res });
  } catch (error: any) {
    console.error("Error enviando test webhook:", error);
    return NextResponse.json({ error: error.message || "Fallo al enviar webhook de prueba." }, { status: 400 });
  }
}
