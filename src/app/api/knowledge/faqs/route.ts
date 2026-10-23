import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const faq = await db.faq.create({
      data: {
        question: data.question,
        answer: data.answer,
      },
    });
    return NextResponse.json(faq);
  } catch (error) {
    console.error("Error al crear FAQ:", error);
    return NextResponse.json({ error: "Error al crear la pregunta frecuente." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const faq = await db.faq.update({
      where: { id: data.id },
      data: {
        question: data.question,
        answer: data.answer,
      },
    });
    return NextResponse.json(faq);
  } catch (error) {
    console.error("Error al editar FAQ:", error);
    return NextResponse.json({ error: "Error al actualizar la pregunta frecuente." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID no proporcionado." }, { status: 400 });

    await db.faq.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar FAQ:", error);
    return NextResponse.json({ error: "Error al eliminar la pregunta frecuente." }, { status: 500 });
  }
}
