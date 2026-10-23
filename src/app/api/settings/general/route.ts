import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [business, config] = await Promise.all([
      db.businessInfo.findFirst(),
      db.assistantConfig.findFirst(),
    ]);

    return NextResponse.json({
      agencyName: business?.agencyName || "Agencia IA",
      agencyLogoUrl: business?.agencyLogoUrl || "",
      timezone: business?.timezone || "America/Bogota",
      model: config?.model || "anthropic/claude-haiku-5.5",
    });
  } catch (error) {
    console.error("Error al obtener ajustes generales:", error);
    return NextResponse.json({ error: "Error al cargar ajustes." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { agencyName, agencyLogoUrl, timezone, model } = await req.json();

    if (agencyName !== undefined || agencyLogoUrl !== undefined || timezone !== undefined) {
      await db.businessInfo.updateMany({
        data: {
          agencyName,
          agencyLogoUrl,
          timezone: timezone || "America/Bogota",
        },
      });
    }

    if (model !== undefined) {
      await db.assistantConfig.updateMany({
        data: {
          model,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al guardar ajustes generales:", error);
    return NextResponse.json({ error: "Error al guardar ajustes." }, { status: 500 });
  }
}
