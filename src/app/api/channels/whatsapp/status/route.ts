import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt, maskToken } from "@/lib/crypto";
import { webhookUrl, webhookVerifyToken, type WhatsAppConfig } from "@/lib/whatsapp/cloud";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await db.channelState.findUnique({ where: { id: "whatsapp" } });
    const cfg = (state?.config as WhatsAppConfig | null) ?? null;

    return NextResponse.json({
      status: state?.encryptedCredentials ? state.status : "disconnected",
      connectedNumber: state?.connectedNumber || null,
      connectedName: state?.connectedName || null,
      wabaId: cfg?.wabaId || "",
      phoneNumberId: cfg?.phoneNumberId || "",
      reminderTemplate: cfg?.reminderTemplate || "",
      reminderTemplateLang: cfg?.reminderTemplateLang || "es",
      // Nunca se envía el token completo al navegador
      tokenMasked: state?.encryptedCredentials ? maskToken(decrypt(state.encryptedCredentials)) : null,
      webhookUrl: webhookUrl(),
      verifyToken: webhookVerifyToken(),
      signatureEnabled: Boolean(process.env.META_APP_SECRET),
      updatedAt: state?.updatedAt || new Date(),
    });
  } catch (error: any) {
    console.error("Error al obtener estado de WhatsApp:", error);
    return NextResponse.json({ error: "Error al consultar estado." }, { status: 500 });
  }
}
