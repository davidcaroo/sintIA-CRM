import { test } from "node:test";
import assert from "node:assert/strict";
import { VerdictSchema } from "../src/lib/lab/judge";
import { PERSONAS } from "../src/lib/lab/personas";

test("PERSONAS contiene personas deterministas válidas para pymes", () => {
  assert.ok(Array.isArray(PERSONAS));
  assert.ok(PERSONAS.length >= 4);
  for (const p of PERSONAS) {
    assert.ok(p.id);
    assert.ok(p.nombre);
    assert.ok(p.descripcion);
    assert.ok(Array.isArray(p.guion) && p.guion.length > 0);
  }
});

test("VerdictSchema valida veredictos de calidad", () => {
  const sample = {
    score: 92,
    veredicto: "verde",
    resumen: "Excelente atención y respeto estricto a las normas de la clínica.",
    hallazgos: [
      {
        tipo: "fuera_de_kb",
        evidencia: "El cliente preguntó por ortodoncia lingual que no figuraba en FAQ.",
        sugerenciaFaq: {
          pregunta: "¿Ofrecen ortodoncia lingual?",
          respuesta: "No, en Clínica Dental Lumen nos especializamos en ortodoncia invisible Invisalign y brackets tradicionales.",
        },
      },
    ],
    sugerenciasFaq: [
      {
        pregunta: "¿Ofrecen ortodoncia lingual?",
        respuesta: "No, en Clínica Dental Lumen nos especializamos en ortodoncia invisible Invisalign y brackets tradicionales.",
      },
    ],
  };

  const parsed = VerdictSchema.parse(sample);
  assert.equal(parsed.score, 92);
  assert.equal(parsed.veredicto, "verde");
  assert.equal(parsed.hallazgos.length, 1);
});
