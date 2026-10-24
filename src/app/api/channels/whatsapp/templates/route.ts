import { NextResponse } from "next/server";
import { getWhatsAppCreds, listApprovedTemplates, metaErrorMessage } from "@/lib/whatsapp/cloud";

export const dynamic = "force-dynamic";

/** Plantillas aprobadas de la WABA, leídas en vivo de Meta (siempre sincronizadas). */
export async function GET() {
  const creds = await getWhatsAppCreds();
  if (!creds) return NextResponse.json({ templates: [], error: "WhatsApp no está conectado." }, { status: 409 });
  try {
    return NextResponse.json({ templates: await listApprovedTemplates(creds) });
  } catch (err) {
    return NextResponse.json({ templates: [], error: metaErrorMessage(err) }, { status: 422 });
  }
}
