# Especificación de Diseño: Laboratorio de Calidad, SSE en Tiempo Real y Rediseño Vocero en Sintia

**Fecha:** 2026-10-23  
**Estado:** Aprobado por el usuario  
**Alcance:**
1. Laboratorio de Calidad con Personas Sintéticas y Juez LLM (0-100) en `/probar`.
2. Bandeja de Conversaciones en Tiempo Real con Server-Sent Events (SSE).
3. Rediseño de UI de `/conversaciones` al estilo Vocero CRM.

---

## 1. Módulo: Laboratorio de Calidad en `/probar`

### Objetivo
Permitir a los dueños de agencias y administradores evaluar objetivamente la calidad, precisión y seguridad del agente de IA antes de ponerlo en producción o tras modificar su conocimiento/prompts.

### Componentes
1. **Personas Sintéticas (`src/lib/lab/personas.ts`)**:
   - `comprador_decidido`: Pregunta por una cita directa de limpieza dental y horarios.
   - `pregunton_tarifas`: Pregunta precios de 3 tratamientos seguidos, pide descuentos y duda.
   - `urgencia_dolor`: Manifiesta dolor agudo o flemón tras una extracción. Debe activar prioridad y ofrecer contacto inmediato.
   - `fuera_de_conocimiento`: Pregunta sobre servicios ajenos a la clínica (ej. cerrajería o marcas desconocidas). Debe declarar no tener la información sin inventar datos.
2. **Sandbox Runner (`src/app/api/lab/run/route.ts`)**:
   - Recibe la solicitud para evaluar una persona individual o la suite completa.
   - Inyecta cada turno secuencialmente al pipeline del motor de Sintia en modo seguro (`isSafeMode: true`, `isTest: true`).
   - Almacena la transcripción de turnos: `{ role: 'cliente' | 'agente', text: string }[]`.
3. **Juez de IA (`src/lib/lab/judge.ts`)**:
   - Recibe: transcripción + base de conocimiento (`renderKb`) + reglas de comportamiento.
   - Esquema de veredicto validado con Zod:
     - `score`: Número de 0 a 100.
     - `veredicto`: `'verde'` (>= 90), `'amarillo'` (70-89), `'rojo'` (< 70).
     - `hallazgos`: Array de `{ tipo: 'alucinacion' | 'fuera_de_kb' | 'debio_escalar' | 'tono', evidencia: string, sugerenciaFaq?: { pregunta: string, respuesta: string } }`.
4. **Interfaz en `/probar` (`src/app/(dashboard)/probar/page.tsx`)**:
   - Selector por pestañas: `[ Simulador Manual | Laboratorio de Calidad ]`.
   - Selector de persona o botón "Ejecutar suite completa".
   - Tarjeta de puntuación global (0-100) con indicador semafórico.
   - Desglose por persona evaluada, con turnos y notas.
   - Botón de 1 clic para añadir FAQs sugeridas directamente a la base de datos de conocimiento.

---

## 2. Módulo: Bandeja en Tiempo Real con Server-Sent Events (SSE)

### Objetivo
Eliminar el refresco por sondeo cada 6 segundos (`setInterval(..., 6000)`) y entregar actualizaciones instantáneas (< 500 ms) cuando un mensaje entra por WhatsApp, Chat Web o respuesta humana.

### Arquitectura
1. **Bus de Eventos In-Memory (`src/lib/events/bus.ts`)**:
   - Implementado con Node.js `EventEmitter` usando `globalThis` para mantener el singleton durante hot-reloads en Next.js.
   - Eventos soportados:
     - `message:new`: `{ conversationId, message }`
     - `conversation:updated`: `{ conversationId, lastMessageAt, status }`
     - `conversation:takeover`: `{ conversationId, status }`
2. **Emisores de Eventos**:
   - `src/app/api/conversations/[id]/messages/route.ts`: Al enviar mensaje manual como humano.
   - `src/app/api/conversations/[id]/takeover/route.ts`: Al pausar o reactivar al asistente.
   - `src/app/api/chat/route.ts`: Al interactuar el visitante por el Chat Web.
   - `worker/index.ts`: Al recibir mensajes de WhatsApp vía Baileys o tras respuesta automática del agente.
3. **Endpoint SSE (`src/app/api/conversations/stream/route.ts`)**:
   - Conexión continua con cabeceras `Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`.
   - Ping keep-alive periódico (cada 25 segundos).
   - Limpieza adecuada de listeners al abortar la conexión del cliente.
4. **Receptor en Frontend (`src/app/(dashboard)/conversaciones/page.tsx`)**:
   - Conexión con `EventSource('/api/conversations/stream')` con reconexión automática.
   - Al recibir `message:new`:
     - Si pertenece al chat activo (`selectedId`), se añade inmediatamente al hilo.
     - Se actualiza la previsualización del último mensaje y la fecha en la lista lateral.

---

## 3. Módulo: Rediseño de UI de Conversaciones al estilo Vocero CRM

### Objetivo
Reemplazar la apariencia plana y estridente por un diseño técnico, ergonómico y minimalista inspirado en Vocero CRM.

### Puntos de Rediseño
1. **Superficies y Paleta**:
   - Reemplazar el morado saturado (`bg-indigo-600`) de las burbujas del asistente por `bg-slate-900 text-slate-50 dark:bg-slate-800 dark:border dark:border-slate-700/80`.
   - Burbujas del cliente en `bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs`.
   - Fondo general del contenedor de mensajes en `bg-slate-50/60 dark:bg-slate-950/40`.
2. **Cabecera y Control de Conversación**:
   - Cabecera limpia con nombre, teléfono en fuente mono pequeña, badge de canal sutil y semáforo de estado (`● Atendiendo Sintia` en esmeralda o `● En mano humana` en ámbar).
   - Botón de devolución/toma de control integrado con diseño tipo píldora interactiva.
   - Banner de advertencia de modo humano: discreto, no invasivo (`bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200`).
3. **Visualización de Herramientas**:
   - En lugar de un panel tosco desplegable, las herramientas ejecutadas por el asistente se muestran como chips técnicos compactos con icono contextual (ej. `[📅 Huecos consultados]`, `[💳 Señal generada]`) que se pueden desplegar con un clic para ver argumentos y resultados en popover o acordeón minimalista.
4. **Lista de Chats Lateral**:
   - Pestañas/filtros (Todas, Requieren atención, WhatsApp, Web) estilizadas con contadores numéricos sutiles.
   - Avatares con iniciales y micro-badge de canal (WhatsApp en verde, Web en azul) en la esquina inferior.
   - Textos de previsualización recortados limpiamente con hora en tipografía monospace ligera.
