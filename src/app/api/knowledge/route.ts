import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [business, services, faqs, note] = await Promise.all([
      db.businessInfo.findFirst({ where: { id: "default" } }),
      db.service.findMany({ orderBy: { order: "asc" } }),
      db.faq.findMany({ orderBy: { order: "asc" } }),
      db.knowledgeNote.findFirst(),
    ]);

    return NextResponse.json({
      business: business || {
        name: "Clínica Dental Lumen",
        activity: "Clínica odontológica integral",
        address: "Calle Gran Vía 32, Madrid",
        phone: "+34 912 345 678",
        website: "https://clinicalumen.es",
      },
      services,
      faqs,
      noteContent: note?.content || "",
    });
  } catch (error) {
    console.error("Error al obtener conocimiento:", error);
    return NextResponse.json({ error: "Error al cargar datos." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { business, noteContent } = await req.json();

    if (business) {
      await db.businessInfo.upsert({
        where: { id: "default" },
        update: {
          name: business.name,
          activity: business.activity,
          address: business.address,
          phone: business.phone,
          website: business.website,
        },
        create: {
          id: "default",
          name: business.name,
          activity: business.activity,
          address: business.address,
          phone: business.phone,
          website: business.website,
        },
      });
    }

    if (noteContent !== undefined) {
      const existing = await db.knowledgeNote.findFirst();
      if (existing) {
        await db.knowledgeNote.update({
          where: { id: existing.id },
          data: { content: noteContent },
        });
      } else {
        await db.knowledgeNote.create({
          data: { content: noteContent },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar conocimiento:", error);
    return NextResponse.json({ error: "Error al guardar cambios." }, { status: 500 });
  }
}
