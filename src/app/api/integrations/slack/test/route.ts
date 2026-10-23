import { NextRequest, NextResponse } from "next/server";
import { sendSlackNotification } from "@/lib/integrations/slack";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { webhookUrl } = await req.json();

    if (webhookUrl) {
      // Guardar antes de probar
      await db.integration.upsert({
        where: { id: "slack" },
        update: {
          encryptedCredentials: encrypt(webhookUrl),
          isConnected: true,
          status: "connected",
        },
        create: {
          id: "slack",
          name: "Slack",
          category: "Comunicación",
          encryptedCredentials: encrypt(webhookUrl),
          isConnected: true,
          status: "connected",
        },
      });
    }

    const res = await sendSlackNotification(
      "🎉 *Mensaje de prueba de Sintia*: Tu integración con Slack está funcionando correctamente.",
      { urgent: false }
    );

    return NextResponse.json({ success: true, res });
  } catch (error: any) {
    console.error("Error en test Slack:", error);
    return NextResponse.json({ error: error.message || "Fallo al enviar mensaje a Slack." }, { status: 400 });
  }
}
