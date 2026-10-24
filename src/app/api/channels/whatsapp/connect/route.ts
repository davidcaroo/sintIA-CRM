import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import {
  getWhatsAppCreds,
  metaErrorMessage,
  registerWebhook,
  testConnection,
  type WhatsAppConfig,
} from "@/lib/whatsapp/cloud";

const schema = z.object({
  wabaId: z.string().trim().min(1, "Falta el WABA ID"),
  phoneNumberId: z.string().trim().min(1, "Falta el Phone Number ID"),
  // Opcional si ya hay una conexión: permite editar la plantilla sin volver a pegar el token
  token: z.string().trim().optional(),
  reminderTemplate: z.string().trim().optional(),
  reminderTemplateLang: z.string().trim().optional(),
});

/** Valida contra Meta, cifra el token y registra el webhook en el número. */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos." }, { status: 400 });
  }
  const body = parsed.data;
  const token = body.token || (await getWhatsAppCreds())?.token;
  if (!token) return NextResponse.json({ error: "Falta el token de acceso." }, { status: 400 });

  let check;
  try {
    check = await testConnection(body.phoneNumberId, token);
  } catch (err) {
    return NextResponse.json({ error: metaErrorMessage(err) }, { status: 422 });
  }

  const config: WhatsAppConfig = {
    wabaId: body.wabaId,
    phoneNumberId: body.phoneNumberId,
    reminderTemplate: body.reminderTemplate || undefined,
    reminderTemplateLang: body.reminderTemplateLang || "es",
  };
  const data = {
    status: "connected",
    qrCode: null,
    encryptedCredentials: encrypt(token),
    config: config as any,
    connectedNumber: check.displayPhoneNumber,
    connectedName: check.verifiedName,
  };
  await db.channelState.upsert({ where: { id: "whatsapp" }, update: data, create: { id: "whatsapp", isActive: true, ...data } });

  const webhook = await registerWebhook({ ...config, token });

  await db.activityLog.create({
    data: {
      action: "whatsapp_connected",
      channel: "whatsapp",
      details: `WhatsApp Cloud API conectado con el número ${check.displayPhoneNumber}.`,
      status: webhook.ok ? "success" : "warning",
      error: webhook.ok ? null : webhook.message,
    },
  });

  return NextResponse.json({ success: true, displayPhoneNumber: check.displayPhoneNumber, webhook });
}
