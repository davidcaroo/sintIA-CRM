import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PERSONAS, LabPersona } from "@/lib/lab/personas";
import { evaluateTranscriptWithJudge, Verdict } from "@/lib/lab/judge";
import { runAssistantConversation } from "@/lib/ai/openrouter";

export const dynamic = "force-dynamic";

export interface PersonaRunResult {
  persona: LabPersona;
  transcript: { role: "cliente" | "agente"; text: string }[];
  verdict: Verdict;
}

export async function POST(req: NextRequest) {
  try {
    const { personaId } = await req.json().catch(() => ({}));

    // 1. Determinar qué personas evaluar
    const personasToRun = personaId && personaId !== "all"
      ? PERSONAS.filter((p) => p.id === personaId)
      : PERSONAS;

    if (personasToRun.length === 0) {
      return NextResponse.json({ error: "Persona no encontrada." }, { status: 404 });
    }

    // 2. Extraer Base de Conocimiento oficial de la BD
    const [faqs, services, profile, config] = await Promise.all([
      db.knowledgeBase.findMany({ where: { isPublished: true } }),
      db.service.findMany({ where: { isActive: true } }),
      db.businessProfile.findFirst(),
      db.assistantConfig.findFirst(),
    ]);

    let kbText = `NEGOCIO: ${profile?.name || "Clínica Dental Lumen"}\n`;
    kbText += `DESCRIPCIÓN: ${profile?.description || ""}\n`;
    kbText += `DIRECCIÓN: ${profile?.address || ""}, ${profile?.city || ""}\n`;
    kbText += `TELÉFONO DE ATENCIÓN: ${profile?.phone || ""}\n\n`;

    kbText += `=== SERVICIOS DISPONIBLES ===\n`;
    for (const s of services) {
      const precio = s.price !== null ? `$ ${Number(s.price).toLocaleString("es-CO")} COP` : "Requiere valoración";
      kbText += `- ${s.name}: ${s.description} | Duración: ${s.durationMinutes}m | Precio: ${precio}\n`;
    }

    kbText += `\n=== PREGUNTAS FRECUENTES (FAQ) ===\n`;
    for (const f of faqs) {
      kbText += `P: ${f.question}\nR: ${f.answer}\n\n`;
    }

    kbText += `\n=== REGLAS DE CONDUCTA ===\n${config?.rules || "Trato profesional, empático y respetuoso."}\n`;

    const results: PersonaRunResult[] = [];

    // 3. Ejecutar simulación secuencial por persona
    for (const persona of personasToRun) {
      const transcript: { role: "cliente" | "agente"; text: string }[] = [];
      const history: { sender: string; text: string }[] = [];

      for (const userMsg of persona.guion) {
        transcript.push({ role: "cliente", text: userMsg });

        // Correr en sandbox seguro
        const aiResponse = await runAssistantConversation(userMsg, history, {
          isSafeMode: true,
          customerName: persona.nombre,
          customerPhone: persona.telefonoFicticio,
          channel: "lab-sandbox",
        });

        transcript.push({ role: "agente", text: aiResponse.reply });

        history.push({ sender: "user", text: userMsg });
        history.push({ sender: "assistant", text: aiResponse.reply });
      }

      // Evaluar transcripción completa con el Juez
      const verdict = await evaluateTranscriptWithJudge({
        personaNombre: persona.nombre,
        transcript,
        kbText,
      });

      results.push({
        persona,
        transcript,
        verdict,
      });
    }

    // Calcular nota global
    const totalScore = results.reduce((acc, r) => acc + r.verdict.score, 0);
    const averageScore = Math.round(totalScore / results.length);
    const overallVerdict = averageScore >= 90 ? "verde" : averageScore >= 70 ? "amarillo" : "rojo";

    // Recopilar sugerencias de FAQ deduplicadas
    const allFaqSuggestions: { pregunta: string; respuesta: string }[] = [];
    const seenQuestions = new Set<string>();

    for (const r of results) {
      for (const faq of r.verdict.sugerenciasFaq || []) {
        if (!seenQuestions.has(faq.pregunta.toLowerCase().trim())) {
          seenQuestions.add(faq.pregunta.toLowerCase().trim());
          allFaqSuggestions.push(faq);
        }
      }
    }

    return NextResponse.json({
      success: true,
      averageScore,
      overallVerdict,
      totalEvaluadas: results.length,
      allFaqSuggestions,
      results,
    });
  } catch (error: any) {
    console.error("Error en Laboratorio de Calidad:", error);
    return NextResponse.json(
      { error: error.message || "Error al ejecutar corrida del laboratorio." },
      { status: 500 }
    );
  }
}
