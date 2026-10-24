# Plan de Implementación: Laboratorio de Calidad, SSE en Tiempo Real y Rediseño Vocero UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar en Sintia el Laboratorio de Calidad con Juez LLM (0-100), el bus de eventos Server-Sent Events (SSE) para actualizaciones en tiempo real (< 500ms) y el rediseño ergonómico de la bandeja de conversaciones al estilo Vocero CRM.

**Architecture:** 
1. Bus singleton en memoria `EventEmitter` en `globalThis` que despacha eventos a un endpoint `/api/conversations/stream` consumido por `EventSource` en `/conversaciones`.
2. Rediseño de la UI de `/conversaciones` sustituyendo burbujas estridentes por paleta de alto contraste slate/obsidian, badges compactos y chips colapsables de herramientas ejecutadas.
3. Suite de personas sintéticas deterministas para pymes locales, sandbox runner en `/api/lab/run` y Juez estructurado con Zod (`judge.ts`) que evalúa alucinaciones, omisión de escala y tono, integrado en pestaña dentro de `/probar`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma, Node.js EventEmitter, Zod, OpenRouter.

**Spec:** `docs/superpowers/specs/2026-10-23-lab-sse-voceroui-design.md`

## Global Constraints
- No añadir dependencias externas innecesarias: usar `node:events` nativo para el bus SSE.
- Mantener compatibilidad con PGlite y Prisma.
- Toda la terminología y textos de la interfaz deben estar en español natural adaptado a clínicas y pymes.
- Seguir la convención de tipos y estilos existentes en Tailwind y Lucide Icons.

---

### Task 1: Bus de Eventos SSE y Endpoint de Streaming

**Files:**
- Create: `src/lib/events/bus.ts`
- Create: `src/app/api/conversations/stream/route.ts`
- Modify: `src/app/api/conversations/[id]/messages/route.ts`
- Modify: `src/app/api/conversations/[id]/takeover/route.ts`
- Modify: `src/app/api/chat/route.ts`
- Modify: `worker/index.ts`
- Test: `tests/events-bus.test.ts`

**Interfaces:**
- Consumes: Node.js `EventEmitter`, tipos de `Prisma.Message` y `Prisma.Conversation`.
- Produces: `emitEvent(event)`, `subscribeEvents(callback)`, `GET /api/conversations/stream`.

- [ ] **Step 1: Escribir el test para el bus de eventos**

```typescript
// tests/events-bus.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { emitEvent, subscribeEvents } from "../src/lib/events/bus";

test("eventBus emite y recibe eventos message:new correctamente", async () => {
  let received: any = null;
  const unsubscribe = subscribeEvents((event) => {
    if (event.type === "message:new") {
      received = event.data;
    }
  });

  emitEvent({
    type: "message:new",
    data: {
      conversationId: "conv-123",
      message: { id: "msg-1", text: "Hola test", sender: "client" },
    },
  });

  await new Promise((r) => setTimeout(r, 50));
  unsubscribe();

  assert.ok(received);
  assert.equal(received.conversationId, "conv-123");
  assert.equal(received.message.text, "Hola test");
});
```

- [ ] **Step 2: Ejecutar el test para comprobar que falla (RED)**

Run: `npx tsx tests/events-bus.test.ts`  
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementar `src/lib/events/bus.ts` y el endpoint SSE**

Crear `src/lib/events/bus.ts` con tipado estricto y singleton en `globalThis`.  
Crear `src/app/api/conversations/stream/route.ts` con headers `text/event-stream` y heartbeat ping.  
Emitir eventos en los endpoints de mensajes y takeover.

- [ ] **Step 4: Ejecutar el test para verificar que pasa (GREEN)**

Run: `npx tsx tests/events-bus.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/events/bus.ts src/app/api/conversations/stream/route.ts tests/events-bus.test.ts
git commit -m "feat(sse): add in-process event bus and conversations sse stream"
```

---

### Task 2: Rediseño de UI de Conversaciones al estilo Vocero con conexión SSE

**Files:**
- Modify: `src/app/(dashboard)/conversaciones/page.tsx`

**Interfaces:**
- Consumes: `GET /api/conversations/stream` vía `EventSource`, `GET /api/conversations`.
- Produces: Interfaz de chat en vivo de alta ergonomía.

- [ ] **Step 1: Conectar `EventSource` y reemplazar el polling por intervalos**

Reemplazar `setInterval(loadConversations, 6000)` por suscripción a `/api/conversations/stream` con reconexión automática en caso de caída.

- [ ] **Step 2: Rediseñar la paleta de burbujas de chat y chips de herramientas**

- Sustituir `bg-indigo-600` por `bg-slate-900 text-white dark:bg-slate-800 dark:border dark:border-slate-700/80`.
- Diseñar la burbuja del cliente en `bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs`.
- Transformar la caja desplegable de herramientas en un chip minimalista tipo píldora (`[📅 Huecos consultados]`) que se expande inline de forma elegante.

- [ ] **Step 3: Pulir cabecera, banner de takeover y lista lateral**

- Header con semáforo de estado (`● Atendiendo Sintia` en verde, `● En mano humana` en ámbar).
- Banner de control manual estilizado (`bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20`).
- Badges de canal en avatares (WhatsApp en verde, Web en azul).
- Filtros con diseño de pestañas Vocero y conteos dinámicos.

- [ ] **Step 4: Verificar la compilación del frontend**

Run: `npm run build` o `npx tsx -e "console.log('checked')"`  
Expected: Build exitoso sin errores de tipos.

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/conversaciones/page.tsx
git commit -m "feat(ui): redesign inbox with vocero style and real-time sse integration"
```

---

### Task 3: Personas Sintéticas y Esquema del Juez de Calidad

**Files:**
- Create: `src/lib/lab/personas.ts`
- Create: `src/lib/lab/judge.ts`
- Test: `tests/lab-judge.test.ts`

**Interfaces:**
- Produces: `PERSONAS` (lista de casos de prueba con guiones deterministas), `evaluateTranscript(input)` con esquema Zod de veredicto.

- [ ] **Step 1: Escribir el test para el Juez de IA**

```typescript
// tests/lab-judge.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { VerdictSchema } from "../src/lib/lab/judge";

test("VerdictSchema valida correctamente la respuesta del juez", () => {
  const sample = {
    score: 95,
    veredicto: "verde",
    resumen: "El asistente respondió con precisión y empatía.",
    hallazgos: [],
    sugerenciasFaq: [
      { pregunta: "¿Aceptan seguros médicos?", respuesta: "Sí, trabajamos con las principales aseguradoras." }
    ]
  };

  const parsed = VerdictSchema.parse(sample);
  assert.equal(parsed.score, 95);
  assert.equal(parsed.veredicto, "verde");
});
```

- [ ] **Step 2: Ejecutar el test para comprobar que falla (RED)**

Run: `npx tsx tests/lab-judge.test.ts`  
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementar `src/lib/lab/personas.ts` y `src/lib/lab/judge.ts`**

- `personas.ts`: Definir `comprador_decidido`, `pregunton_tarifas`, `urgencia_dolor`, `fuera_de_conocimiento`.
- `judge.ts`: Prompt especializado con las 4 categorías (`alucinacion`, `fuera_de_kb`, `debio_escalar`, `tono`) y cálculo de nota 0-100.

- [ ] **Step 4: Ejecutar el test para comprobar que pasa (GREEN)**

Run: `npx tsx tests/lab-judge.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lab/personas.ts src/lib/lab/judge.ts tests/lab-judge.test.ts
git commit -m "feat(lab): add synthetic personas and llm-as-a-judge evaluation schema"
```

---

### Task 4: Sandbox Runner y Endpoints del Laboratorio (`/api/lab/run` y `/api/lab/add-faq`)

**Files:**
- Create: `src/app/api/lab/run/route.ts`
- Create: `src/app/api/lab/add-faq/route.ts`
- Test: `tests/lab-api.test.ts`

**Interfaces:**
- Consumes: `engine.processMessage` o motor `test-chat`, Prisma `knowledgeBase`.
- Produces: `POST /api/lab/run` (ejecuta guion y devuelve veredicto del juez), `POST /api/lab/add-faq` (inserta FAQ recomendada).

- [ ] **Step 1: Implementar `src/app/api/lab/run/route.ts`**

- Ejecuta secuencialmente los turnos de la persona seleccionada con bandera de seguridad `isSafeMode: true` e `isTest: true`.
- Extrae la Base de Conocimiento de la clínica de Prisma.
- Invoca al Juez con la transcripción completa y devuelve el veredicto con `score`.

- [ ] **Step 2: Implementar `src/app/api/lab/add-faq/route.ts`**

- Endpoint para que un clic en la UI agregue de inmediato la pregunta/respuesta sugerida por el Juez a la base de conocimiento de la clínica.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/lab/run/route.ts src/app/api/lab/add-faq/route.ts
git commit -m "feat(lab): add sandbox test runner and faq auto-add endpoints"
```

---

### Task 5: Interfaz del Laboratorio de Calidad en `/probar`

**Files:**
- Modify: `src/app/(dashboard)/probar/page.tsx`

**Interfaces:**
- Consumes: `POST /api/lab/run`, `POST /api/lab/add-faq`.
- Produces: Pestañas `[ Chat Manual | Laboratorio de Calidad ]` con visualizador de puntuación, selector de personas y panel de mejoras.

- [ ] **Step 1: Añadir selector de pestañas en la parte superior de `/probar`**

- Pestaña 1: "Simulador Manual" (mantiene el chat y la línea de tiempo de razonamiento actual).
- Pestaña 2: "Laboratorio de Calidad" (nueva vista de auto-evaluación).

- [ ] **Step 2: Construir el panel del Laboratorio de Calidad**

- Tarjeta de nota global 0-100 con indicador semafórico (`Verde` $\ge 90$, `Amarillo` $70-89$, `Rojo` $< 70$).
- Selector de personas sintéticas (`Comprador decidido`, `Preguntón de precios`, `Urgencia médica`, `Fuera de conocimiento`) con botón "Evaluar agente".
- Indicador visual animado de turnos de prueba en progreso.
- Acordeón de resultados con desglose de la conversación y notas del Juez.
- Sección de hallazgos con clasificación de errores y botón para *"Añadir a Conocimiento"* con un solo clic.

- [ ] **Step 3: Verificar compilación completa y linting**

Run: `npm run build`  
Expected: Compilación limpia exitosa.

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/probar/page.tsx
git commit -m "feat(ui): integrate quality lab tab with score gauge and automated evaluation in /probar"
```
