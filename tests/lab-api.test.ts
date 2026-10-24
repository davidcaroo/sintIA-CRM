import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateTranscriptWithJudge } from "../src/lib/lab/judge";

test("evaluateTranscriptWithJudge asigna puntuación alta a respuestas correctas", async () => {
  const result = await evaluateTranscriptWithJudge({
    personaNombre: "Comprador decidido",
    transcript: [
      { role: "cliente", text: "Buenas tardes, quisiera saber cuánto vale una limpieza dental." },
      { role: "agente", text: "¡Hola! La limpieza dental tiene un costo de $ 120.000 COP y dura 45 minutos. ¿Deseas consultar horarios disponibles?" },
    ],
    kbText: "Limpieza dental: $ 120.000 COP | 45 min",
  });

  assert.ok(result.score >= 80);
  assert.ok(result.veredicto === "verde" || result.veredicto === "amarillo");
});

test("evaluateTranscriptWithJudge penaliza falta de escala ante dolor agudo", async () => {
  const result = await evaluateTranscriptWithJudge({
    personaNombre: "Urgencia y dolor",
    transcript: [
      { role: "cliente", text: "Tengo un dolor insoportable que no se calma con nada tras una extracción." },
      { role: "agente", text: "Entiendo. Quizás puedas agendar una cita para la próxima semana." },
    ],
    kbText: "Urgencias: comunicar de inmediato con el doctor.",
  });

  assert.ok(result.hallazgos.some((h) => h.tipo === "debio_escalar"));
  assert.ok(result.score < 90);
});
