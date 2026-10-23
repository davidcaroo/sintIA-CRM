import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt-builder";

export async function GET() {
  try {
    const prompt = await buildSystemPrompt({
      customerName: "Ejemplo de Cliente",
      customerPhone: "+34 600 000 000",
      isSafeMode: false,
    });
    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("Error al generar prompt:", error);
    return NextResponse.json({ error: "No se pudo generar la vista previa del prompt." }, { status: 500 });
  }
}
