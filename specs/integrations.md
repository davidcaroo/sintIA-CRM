# Especificación Técnica: Módulos de Integración (`specs/integrations.md`)

Toda integración en Sintia opera como un módulo autocontenido con:
1. Su tarjeta interactiva en el panel (`/integraciones`).
2. Su flujo de autorización (OAuth 2.0 o Clave API).
3. Sus herramientas inyectadas dinámicamente en el catálogo del asistente de IA.

---

## 1. Google Calendar (`src/lib/integrations/google/calendar.ts`)
- **Autorización:** Google OAuth 2.0 con scopes incrementales (`calendar.events`, `calendar.readonly`).
- **Callback:** `/api/integrations/google/callback`.
- **Configuración:** Calendario de destino (`calendarId`, por defecto `"primary"`), duración base de cita, margen entre citas y antelación mínima en horas.
- **Formato del Evento:**
  - Título: `{Servicio} — {Nombre del Cliente}`
  - Descripción: `Paciente: ... | Teléfono: ... | Creada por Sintia`
  - Zona Horaria: `America/Bogota`

---

## 2. Gmail (`src/lib/integrations/google/gmail.ts`)
- **Autorización:** Scope `gmail.send` (permiso restringido únicamente para enviar correos, sin acceso a leer la bandeja de entrada del usuario).
- **Herramienta IA:** Enviar la confirmación inmediata de la cita al correo electrónico suministrado por el cliente.
- **Automatización:** Resumen diario nocturno (20:30) al administrador con métricas del día (conversaciones atendidas, citas creadas y handoffs pendientes).

---

## 3. Google Sheets (`src/lib/integrations/google/sheets.ts`)
- **Autorización:** Scope `drive.file` (únicamente concede acceso a los archivos y hojas creados por Sintia, protegiendo el resto de documentos del Google Drive del usuario).
- **Comportamiento:** Al conectar, crea automáticamente la hoja de cálculo *"Contactos — {Nombre del Negocio}"* y sincroniza en columnas: Nombre, Teléfono, Canal de Entrada, Fecha de Creación y Última Cita.

---

## 4. Stripe (`src/lib/integrations/stripe/index.ts`)
- **Autorización:** Clave de API Restringida (`rk_live_...` o `rk_test_...`) con permisos para crear sesiones de Checkout.
- **Operación:** Genera sesiones de Stripe Checkout con importes parametrizados (ej: seña de reserva de $ 50.000 COP). El enlace se envía al chat para que el cliente confirme su cita pagando con tarjeta o medios locales.

---

## 5. Slack (`src/lib/integrations/slack/index.ts`)
- **Autorización:** Incoming Webhook URL.
- **Operación:** Emite mensajes estructurados con bloques (`blocks`) ante:
  - Solicitudes de intervención humana (handoff).
  - Alertas de dolor agudo o quejas de clientes.
  - Nuevas citas confirmadas en el calendario.

---

## 6. Webhooks Genéricos (`src/lib/integrations/webhooks/index.ts`)
- **Destino:** Plataformas de automatización no-code como **n8n**, **Make** o **Zapier**.
- **Seguridad:** Cada petición saliente `POST` incluye una cabecera con firma criptográfica `X-Sintia-Signature` calculada mediante `HMAC-SHA256` con el secreto compartido para validar la autenticidad del payload en el receptor.
