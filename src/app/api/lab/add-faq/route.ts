import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { question, answer, category } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Pregunta y respuesta son obligatorias." },
        { status: 400 }
      );
    }

    // Verificar si ya existe una similar
    const existing = await db.faq.findFirst({
      where: {
        question: {
          contains: question.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyExisted: true,
        faq: existing,
      });
    }

    const created = await db.faq.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      faq: created,
    });
  } catch (error: any) {
    console.error("Error al añadir FAQ sugerida:", error);
    return NextResponse.json(
      { error: error.message || "Error al guardar en base de conocimiento." },
      { status: 500 }
    );
  }
}
