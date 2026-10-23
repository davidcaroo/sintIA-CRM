import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const channel = await db.channelState.findUnique({
      where: { id: "webchat" },
    });
    return NextResponse.json(channel || {
      isActive: true,
      widgetColor: "#0284c7",
      welcomeText: "¡Hola! ¿En qué podemos ayudarte?",
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar configuración." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isActive, widgetColor, welcomeText } = await req.json();

    const updated = await db.channelState.upsert({
      where: { id: "webchat" },
      update: {
        isActive: isActive !== undefined ? isActive : true,
        widgetColor: widgetColor || "#0284c7",
        welcomeText: welcomeText || "¡Hola! ¿En qué podemos ayudarte?",
      },
      create: {
        id: "webchat",
        isActive: isActive !== undefined ? isActive : true,
        widgetColor: widgetColor || "#0284c7",
        welcomeText: welcomeText || "¡Hola! ¿En qué podemos ayudarte?",
      },
    });

    return NextResponse.json({ success: true, channel: updated });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar." }, { status: 500 });
  }
}
