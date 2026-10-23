import { NextRequest, NextResponse } from "next/server";
import { runAssistantConversation } from "@/lib/ai/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { message, history, isSafeMode } = await req.json();

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Mensaje vacío." }, { status: 400 });
    }

    const response = await runAssistantConversation(message, history || [], {
      isSafeMode: isSafeMode ?? true,
      channel: "test",
      customerName: "Visitante de Prueba",
      customerPhone: "+34 600 000 000",
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error en test-chat API:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar mensaje." },
      { status: 500 }
    );
  }
}
