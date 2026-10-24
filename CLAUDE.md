# CLAUDE.md — Directrices Operativas para Asistentes y Agentes de IA

Este archivo contiene las directrices técnicas, restricciones de diseño y comandos obligatorios para que cualquier asistente o agente de IA modifique y extienda **Sintia CRM** de manera segura y sin provocar regresiones.

---

## 🏗️ Arquitectura de los Dos Procesos (Regla Vital)

El proyecto opera con dos procesos principales que comparten el mismo código fuente:

1. **`web` (Next.js 15 App Router):**
   - Interfaz gráfica del panel de administración (`src/app/(dashboard)`).
   - Rutas API (`src/app/api/...`), autenticación basada en JWT (`src/lib/auth.ts`, `src/middleware.ts`).
   - Widget de chat web embebible (`/api/widget.js`, `/api/chat`).
   - Webhook público de WhatsApp Cloud API (`/api/webhooks/whatsapp/[token]`): valida token de ruta + firma `x-hub-signature-256` y guarda cada mensaje en `WhatsAppInbound` **antes** de responder 200.
   - Endpoint SSE para streaming de eventos (`/api/conversations/stream`).
   
2. **`worker` (Node.js de larga duración):**
   - Reside en [`worker/index.ts`](file:///c:/Users/Ingca/OneDrive/Documentos/Asistente de IA%20-%20Antigravity/worker/index.ts).
   - Lee `WhatsAppInbound` (`worker/whatsapp.ts`), agrupa ráfagas del mismo cliente con un **debounce de 3,5 s**, llama a la IA y responde por la Cloud API. Un mensaje solo se marca procesado al terminar su ráfaga.
   - Ejecuta las tareas programadas periódicas (`worker/scheduler.ts`): recordatorios de citas y resúmenes diarios por correo.

> **IMPORTANTE:** Ambos procesos se comunican a través de la base de datos (tablas `ChannelState`, `WhatsAppInbound` y `Conversation`). Toda llamada a Meta pasa por [`src/lib/whatsapp/cloud.ts`](src/lib/whatsapp/cloud.ts) (HTTP puro, sirve en ambos procesos). **Nunca importes `worker/*` desde rutas de Next.js.** Fuera de la ventana de 24 h desde el último mensaje del cliente solo se permiten plantillas aprobadas.

---

## 💻 Comandos Frecuentes

```bash
# Desarrollo local unificado (Levanta PGlite en 5433, Next.js en 3000 y el Worker a la vez)
npm run dev

# Ejecutar sólo la web
npm run dev:web

# Ejecutar sólo el worker
npm run dev:worker

# Sincronizar esquema de base de datos Prisma (PostgreSQL / PGlite)
npx prisma db push --skip-generate

# Sembrar datos de prueba
npm run db:seed

# Compilar para producción
npm run build

# Ejecutar suite de pruebas unitarias
npx tsx tests/events-bus.test.ts
npx tsx tests/lab-judge.test.ts
npx tsx tests/whatsapp-cloud.test.ts
npx tsx tests/web-extract.test.ts
```

---

## 🔒 Reglas Inquebrantables de Seguridad y Cifrado

1. **Tokens e Integraciones:**
   - Toda credencial, clave de API o token OAuth (Google, Slack, Stripe) **debe cifrarse** usando `encryptToken()` de [`src/lib/crypto.ts`](file:///c:/Users/Ingca/OneDrive/Documentos/Asistente de IA%20-%20Antigravity/src/lib/crypto.ts) con algoritmo `AES-256-GCM` y la clave `ENCRYPTION_KEY`.
   - **Nunca** envíes tokens completos al cliente web en respuestas JSON. Muestra únicamente prefijos enmascarados (ej: `rk_test_••••••••`).
2. **Claves de IA:**
   - La variable `OPENROUTER_API_KEY` reside exclusivamente en el entorno del servidor y **nunca debe filtrarse al navegador**.
3. **WhatsApp Cloud API (Meta):**
   - El token de Meta se guarda cifrado en `ChannelState.encryptedCredentials`; WABA ID, Phone Number ID y plantilla de recordatorio en `ChannelState.config`.
   - Define `META_APP_SECRET` en producción para verificar la firma de cada webhook. `APP_URL` debe ser pública con HTTPS.
   - Adjuntos entrantes (audio, imagen, PDF, video) se convierten en texto con [`src/lib/whatsapp/media-ai.ts`](src/lib/whatsapp/media-ai.ts) vía [`src/lib/ai/llm.ts`](src/lib/ai/llm.ts) (Gemini directo u OpenRouter). El panel los sirve con `/api/whatsapp/media/[id]`, solo con sesión y solo tipos seguros en línea.
   - Estados de salientes (`Message.status`: sent → delivered → read, o failed) los actualiza el webhook y nunca retroceden.

---

## 🧠 Convenciones del Motor de IA y Herramientas

1. **Cliente OpenRouter (`src/lib/ai/openrouter.ts`):**
   - Siempre incluye las cabeceras HTTP:
     - `HTTP-Referer`: `process.env.APP_URL`
     - `X-Title`: `"Sintia"`
   - Si una llamada con el modelo elegido falla por indisponibilidad, el sistema **debe reintentar automáticamente una vez con el modelo por defecto** (`DEFAULT_MODEL` = `anthropic/claude-haiku-5.5`).
2. **Llamada a Herramientas (Function Calling):**
   - Las herramientas disponibles se definen en [`src/lib/ai/tools.ts`](file:///c:/Users/Ingca/OneDrive/Documentos/Asistente de IA%20-%20Antigravity/src/lib/ai/tools.ts) y se ejecutan en [`src/lib/ai/executor.ts`](file:///c:/Users/Ingca/OneDrive/Documentos/Asistente de IA%20-%20Antigravity/src/lib/ai/executor.ts).
   - En **Modo Seguro** (`isSafeMode: true`), las herramientas de escritura (`crear_cita`, `enviar_confirmacion_cita`, `crear_enlace_pago_senal`, `notificar_al_equipo`) deben simular la respuesta sin modificar servicios externos reales.

---

## 🎨 Principios de Diseño UI/UX y Frontend

1. **Modo Claro / Oscuro:**
   - Todo nuevo componente debe soportar ambas paletas usando clases de Tailwind con variante `dark:` (ej: `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100`).
2. **Hidratación en React 19:**
   - En componentes donde se rendericen fechas relativas o atributos dinámicos, usa `suppressHydrationWarning` para prevenir desincronizaciones entre el servidor y el cliente.
3. **Consistencia de Zona Horaria:**
   - La zona horaria predeterminada para el negocio es configurada dinámicamente desde `BusinessInfo.timezone` (por defecto `America/Bogota`), con formato numérico en moneda colombiana (`$ COP`).
