import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const config = await db.assistantConfig.findFirst({
      where: { id: "default" },
    });
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error al obtener comportamiento:", error);
    return NextResponse.json({ error: "Error al cargar configuración." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const updated = await db.assistantConfig.upsert({
      where: { id: "default" },
      update: {
        name: body.name,
        tone: body.tone,
        welcomeMessage: body.welcomeMessage,
        customInstructions: body.customInstructions,
        neverDoRules: body.neverDoRules,
        businessHours: body.businessHours,
        afterHoursBehavior: body.afterHoursBehavior,
        handoffOnComplaint: body.handoffOnComplaint,
        handoffOnUrgency: body.handoffOnUrgency,
        handoffOnRequest: body.handoffOnRequest,
        handoffOnUnknown: body.handoffOnUnknown,
        handoffCustomRule: body.handoffCustomRule,
      },
      create: {
        id: "default",
        name: body.name || "Sintia",
        tone: body.tone || "cercano",
        welcomeMessage: body.welcomeMessage || "¡Hola! ¿En qué puedo ayudarte?",
        customInstructions: body.customInstructions,
        neverDoRules: body.neverDoRules,
        businessHours: body.businessHours,
        afterHoursBehavior: body.afterHoursBehavior || "take_message",
        handoffOnComplaint: body.handoffOnComplaint ?? true,
        handoffOnUrgency: body.handoffOnUrgency ?? true,
        handoffOnRequest: body.handoffOnRequest ?? true,
        handoffOnUnknown: body.handoffOnUnknown ?? true,
        handoffCustomRule: body.handoffCustomRule,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al guardar comportamiento:", error);
    return NextResponse.json({ error: "Error al guardar configuración." }, { status: 500 });
  }
}
