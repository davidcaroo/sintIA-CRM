# Especificación Técnica: Arquitectura del Sistema (`specs/architecture.md`)

## 1. Visión General
**Sintia** es una plataforma CRM multicanal basada en IA para negocios locales, diseñada bajo una arquitectura desacoplada de **dos procesos complementarios** que comparten la misma base de datos relacional y el mismo modelo tipado en TypeScript.

```
                              ┌───────────────────────────────────────────────┐
                              │                   CLIENTES                    │
                              │        (WhatsApp / Web Chat Flotante)         │
                              └──────────────────────┬────────────────────────┘
                                                     │
                             ┌───────────────────────┴───────────────────────┐
                             │                                               │
                             ▼                                               ▼
               ┌───────────────────────────┐                   ┌───────────────────────────┐
               │      PROCESO WORKER       │                   │        PROCESO WEB        │
               │   (Node.js de larga vida) │                   │    (Next.js App Router)   │
               ├───────────────────────────┤                   ├───────────────────────────┤
               │ • Baileys Socket          │                   │ • Panel de Administración │
               │ • Búfer Debounce 8s       │                   │ • API REST & Server Actions│
               │ • Cronjobs de Recordatorio│                   │ • Stream SSE en tiempo real│
               │ • Dispatcher a OpenRouter │                   │ • OAuth Google / Stripe   │
               └─────────────┬─────────────┘                   └─────────────┬─────────────┘
                             │                                               │
                             └───────────────────────┬───────────────────────┘
                                                     │
                                                     ▼
                                       ┌───────────────────────────┐
                                       │   BASE DE DATOS RELACIONAL│
                                       │   PostgreSQL / PGlite     │
                                       ├───────────────────────────┤
                                       │ • ChannelState (QR & sync)│
                                       │ • Conversations & Messages│
                                       │ • Appointments & Contacts │
                                       │ • ActivityLogs & Business │
                                       └───────────────────────────┘
```

---

## 2. El Proceso Worker (`worker/index.ts`)

### 2.1 Ciclo de Vida del Socket Baileys
- Mantiene una conexión WebSocket permanente con los servidores de WhatsApp mediante `@whiskeysockets/baileys`.
- Guarda credenciales en `./whatsapp-session` usando `useMultiFileAuthState`.
- Al generar un código QR, lo convierte a DataURL (`QRCode.toDataURL`) y actualiza la fila singleton en la tabla `channelState`.
- Al detectar el código `515` (reinicio requerido tras escaneo), reinicia el socket automáticamente tras 2 segundos para completar el handshake.

### 2.2 Búfer de Mensajes de 8 Segundos (Anti-Fragmentación)
- Los usuarios de WhatsApp suelen enviar ideas divididas en varios mensajes consecutivos rápidos (ej: *"Hola"*, *"Quería saber si tienen cita"*, *"Para limpieza mañana"*).
- El worker implementa una cola con `Map<string, MessageBufferItem>`.
- Cada mensaje entrante reinicia un temporizador `setTimeout` de 8 segundos (`DEBOUNCE_DELAY_MS`).
- Cuando se cumplen 8 segundos de silencio, se unen los textos en un solo párrafo coherente antes de llamar a la API de OpenRouter.

### 2.3 Scheduler y Cronjobs (`worker/scheduler.ts`)
- Un loop periódico cada 60 segundos comprueba:
  1. Citas del día siguiente sin recordatorio (`reminderSent: false`) y envía un mensaje de cortesía por WhatsApp al paciente.
  2. A las 20:30 envía el resumen diario consolidado al correo del dueño mediante la integración de Gmail.

---

## 3. El Proceso Web (`src/app`)

### 3.1 Streaming de Eventos (Server-Sent Events)
- [`/api/channels/whatsapp/sse`](file:///c:/Users/Ingca/OneDrive/Documentos/Asistente de IA%20-%20Antigravity/src/app/api/channels/whatsapp/sse/route.ts): Emite el estado de la conexión y el código QR en tiempo real a los navegadores abiertos.
- [`/api/conversations/stream`](file:///c:/Users/Ingca/OneDrive/Documentos/Asistente de IA%20-%20Antigravity/src/app/api/conversations/stream/route.ts): Suscripción en vivo al bus de eventos de mensajes para actualizar la bandeja de entrada instantáneamente sin recargar la página.

### 3.2 Widget Embebible (`/api/widget.js`)
- Script autocontenido Vanilla JavaScript que inyecta un iframe/burbuja flotante en cualquier sitio web externo con una sola línea de código:
  `<script src="https://tu-dominio.com/api/widget.js" defer></script>`.
