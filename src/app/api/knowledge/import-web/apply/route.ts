import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildImportedBlock, mergeNote } from "@/lib/knowledge/web-extract";

/**
 * Guarda lo seleccionado del importador web sin duplicar:
 * - servicios y FAQs con el mismo nombre/pregunta se actualizan,
 * - el bloque importado de esa web en el conocimiento adicional se reemplaza.
 */

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

export async function POST(req: NextRequest) {
  try {
    const { website, business, services = [], faqs = [], contact, knowledge, includeContact } = await req.json();
    let host = "web";
    try {
      host = new URL(website).hostname.replace(/^www\./, "");
    } catch {}

    const counts = { servicesCreated: 0, servicesUpdated: 0, faqsCreated: 0, faqsUpdated: 0 };

    if (business) {
      const clean = Object.fromEntries(
        Object.entries(business).filter(([k, v]) => ["name", "activity", "address", "phone", "website"].includes(k) && typeof v === "string" && v.trim())
      );
      if (Object.keys(clean).length) {
        await db.businessInfo.upsert({ where: { id: "default" }, update: clean, create: { id: "default", ...clean } });
      }
    }

    if (services.length) {
      const existing = await db.service.findMany({ select: { id: true, name: true } });
      const byName = new Map(existing.map((s) => [norm(s.name), s.id]));
      let order = existing.length;
      for (const s of services) {
        if (!s?.name?.trim()) continue;
        const data = {
          name: s.name.trim(),
          description: s.description || "",
          durationMinutes: Number.isFinite(s.durationMinutes) && s.durationMinutes > 0 ? Math.round(s.durationMinutes) : 30,
          price: typeof s.price === "number" ? s.price : null,
          isFromPrice: !!s.isFromPrice,
          requiresValuation: !!s.requiresValuation,
        };
        const id = byName.get(norm(data.name));
        if (id) {
          await db.service.update({ where: { id }, data });
          counts.servicesUpdated++;
        } else {
          const created = await db.service.create({ data: { ...data, order: order++ } });
          byName.set(norm(created.name), created.id);
          counts.servicesCreated++;
        }
      }
    }

    if (faqs.length) {
      const existing = await db.faq.findMany({ select: { id: true, question: true } });
      const byQ = new Map(existing.map((f) => [norm(f.question), f.id]));
      let order = existing.length;
      for (const f of faqs) {
        if (!f?.question?.trim() || !f?.answer?.trim()) continue;
        const id = byQ.get(norm(f.question));
        if (id) {
          await db.faq.update({ where: { id }, data: { answer: f.answer.trim() } });
          counts.faqsUpdated++;
        } else {
          const created = await db.faq.create({ data: { question: f.question.trim(), answer: f.answer.trim(), order: order++ } });
          byQ.set(norm(created.question), created.id);
          counts.faqsCreated++;
        }
      }
    }

    if (includeContact || knowledge?.trim()) {
      const block = buildImportedBlock(host, includeContact ? contact : null, knowledge || "");
      const note = await db.knowledgeNote.findFirst();
      const content = mergeNote(note?.content || "", host, block);
      if (note) await db.knowledgeNote.update({ where: { id: note.id }, data: { content } });
      else await db.knowledgeNote.create({ data: { content } });
    }

    await db.activityLog.create({
      data: {
        action: "knowledge_import_web",
        channel: "system",
        details: `Conocimiento importado de ${host}: ${counts.servicesCreated} servicios nuevos, ${counts.servicesUpdated} actualizados, ${counts.faqsCreated} FAQs nuevas, ${counts.faqsUpdated} actualizadas.`,
        status: "success",
      },
    });

    return NextResponse.json({ success: true, ...counts });
  } catch (error: any) {
    console.error("Error guardando importación web:", error);
    return NextResponse.json({ error: error.message || "No se pudo guardar la importación." }, { status: 500 });
  }
}
