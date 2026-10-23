# Sintia — Asistente de IA para Negocios Locales

**Sintia** es una plataforma *white-label* diseñada para agencias que instalan y gestionan asistentes de inteligencia artificial para clientes de negocios locales (clínicas, despachos, academias, salones, restaurantes, etc.).

El asistente atiende a los clientes de forma natural por **WhatsApp** y por el **chat de su página web**, responde dudas con la información del negocio, agenda citas directamente en **Google Calendar**, toma pagos de señal con **Stripe**, actualiza contactos en **Google Sheets**, avisa al equipo en **Slack** y traspasa la conversación a una persona en tiempo real cuando es necesario.

Toda la interfaz y el asistente operan en **Español de España** y zona horaria **Europe/Madrid**.

---

## 🚀 Inicio rápido en local (1 solo comando)

Sintia incluye un motor de base de datos PostgreSQL embebido (**PGlite**) que funciona sin necesidad de instalar Docker ni PostgreSQL localmente.

### 1. Clonar e instalar dependencias
```bash
git clone <tu-repositorio>
cd "Asistente de IA - Antigravity"
npm install
```

### 2. Configurar variables de entorno
Copia la plantilla `.env.example` a `.env`:
```bash
cp .env.example .env
```
*(Para arrancar y probar la interfaz no necesitas cambiar nada en `.env`; viene preconfigurado con claves de desarrollo).*

### 3. Arrancar la aplicación
```bash
npm run dev
```
Este comando único:
1. Inicia el servidor PostgreSQL embebido en `127.0.0.1:5433`.
2. Sincroniza el esquema con Prisma (`prisma db push`).
3. Si la base de datos está vacía, carga los datos de demostración de **Clínica Dental Lumen**.
4. Arranca la aplicación web en `http://localhost:3000`.
5. Arranca el worker en segundo plano para WhatsApp y recordatorios automáticos.

---

## 🔑 Credenciales de Acceso Inicial

Accede a la consola de administración en [http://localhost:3000](http://localhost:3000):

* **Usuario:** `admin@sintia.local`
* **Contraseña:** `admin123456`

---

## 🧭 Pantallas del Panel de Control

1. **Resumen (`/`)**: Interruptor general de actividad, estado en tiempo real de canales e integraciones, métricas del día (conversaciones, citas, pendientes, tiempo de respuesta) y auditoría reciente.
2. **Comportamiento (`/comportamiento`)**: Tono (cercano, profesional, directo), mensaje de bienvenida, reglas libres y restricciones estrictas, horario semanal con respuesta fuera de turno, disparadores de traspaso a humanos y visor del prompt compilado en tiempo real.
3. **Conocimiento (`/conocimiento`)**: Ficha del negocio, catálogo de servicios con duraciones y precios, preguntas frecuentes (FAQ) e importador web asistido por IA que scrapea hasta 5 páginas de cualquier sitio y auto-rellena la ficha en JSON.
4. **Integraciones (`/integraciones`)**: Catálogo modular de conexiones:
   - **Google Calendar**: Gestión de citas, consulta de huecos libres y buffers.
   - **Gmail**: Envío automático de confirmaciones y resumen diario para el dueño.
   - **Google Sheets**: Sincronización continua de leads y clientes.
   - **Slack**: Alertas inmediatas cuando se agenda una cita o se requiere atención humana.
   - **Stripe**: Cobro de señales por servicio con enlaces de pago protegidos.
   - **Webhooks**: Integración con n8n, Make, Zapier mediante firmas HMAC-SHA256.
5. **Canales (`/canales`)**:
   - **WhatsApp**: Conexión por código QR en vivo mediante Baileys con persistencia en disco y búfer inteligente de 8 segundos para no pisar mensajes continuos.
   - **Chat Web**: Personalizador visual de burbuja (color, texto, avatar), código de inserción `<script>` y página interactiva de prueba en [`/demo`](http://localhost:3000/demo).
6. **Probar (`/probar`)**: Entorno de pruebas interactivo con simulador de cliente y **Línea de tiempo de razonamiento** que desglosa en tiempo real cada llamada a herramienta con sus parámetros y respuesta. Incluye interruptor de **Modo Seguro** para simular escrituras sin tocar APIs externas.
7. **Conversaciones (`/conversaciones`)**: Bandeja de entrada estilo chat en dos columnas con filtros (*Todas, Necesitan atención, WhatsApp, Web*), distintivos por canal y botón **Tomar el control** para pausar al asistente y responder manualmente.
8. **Actividad (`/actividad`)**: Registro detallado de auditoría de todas las acciones del asistente con filtros por integración y resultado.
9. **Ajustes (`/ajustes`)**: Configuración de zona horaria, selector dinámico de modelos OpenRouter con soporte nativo de herramientas (`tools`), calculadora de costes por conversación en base a tokens, saldo de API y personalización de marca (*White-label*).

---

## ⚙️ Guía de Configuración de Google Cloud OAuth

Para activar **Google Calendar**, **Gmail** y **Google Sheets**:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) y crea un proyecto (ej. `Sintia-Asistente`).
2. En **APIs y servicios > Biblioteca**, habilita:
   - *Google Calendar API*
   - *Gmail API*
   - *Google Sheets API*
   - *Google Drive API*
3. En **Pantalla de consentimiento de OAuth**:
   - Tipo de usuario: **Externo** (o Interno si usas Google Workspace).
   - Completa el nombre de la app y correo de asistencia.
   - Añade los siguientes alcances (*Scopes*):
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/drive.file`
     - `https://www.googleapis.com/auth/userinfo.email`
4. En **Credenciales > Crear credenciales > ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - Nombre: `Sintia Web Client`.
   - **URI de redireccionamiento autorizados:**
     ```
     http://localhost:3000/api/integrations/google/callback
     ```
     *(En producción sustituye `http://localhost:3000` por tu dominio público, ej. `https://sintia.tudominio.com/api/integrations/google/callback`)*.
5. Copia el **Client ID** y **Client Secret** en tu `.env`:
   ```env
   GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="tu-client-secret"
   ```
6. En el panel de Sintia, ve a **Integraciones** y pulsa **Conectar** en Google Calendar, Gmail o Google Sheets.

---

## 🤖 Configuración de OpenRouter

1. Crea una cuenta en [openrouter.ai](https://openrouter.ai/).
2. Genera una API Key y añádela a tu `.env`:
   ```env
   OPENROUTER_API_KEY="sk-or-v1-..."
   ```
3. Sintia utiliza por defecto `anthropic/claude-haiku-5.5` con reintento automático y soporte para herramientas. Puedes cambiar de modelo en cualquier momento desde **Ajustes > Modelo de IA**.

---

## 💬 Conexión de WhatsApp

1. Dirígete a **Canales > WhatsApp** en el panel.
2. Escanea el código QR que se actualiza automáticamente con tu aplicación de WhatsApp (en *Dispositivos vinculados*).
3. La sesión se guarda en la carpeta configurada en `WHATSAPP_SESSION_DIR` (por defecto `./whatsapp-session`) y reconecta de forma autónoma ante caídas o reinicios.
4. El búfer de mensajes de 8 segundos agrupa automáticamente los mensajes consecutivos de un cliente para responder de manera coherente sin generar llamadas redundantes a la IA.

---

## 🐳 Despliegue en Producción (Docker & Traefik)

El proyecto incluye:
- `Dockerfile`: Construcción optimizada multi-etapa con el modo `standalone` de Next.js.
- `docker-compose.yml`: Configuración lista para VPS (ej. Hostinger) con red externa de Traefik, certificados SSL Let's Encrypt automáticos y servicio PostgreSQL dedicado.
- `.github/workflows/deploy.yml`: Flujo de CI/CD para compilar y publicar automáticamente la imagen en GitHub Container Registry (`ghcr.io`).

### Comandos de producción:
```bash
# 1. Configurar variables de producción en .env
APP_URL=https://sintia.tudominio.com
NEXTAUTH_URL=https://sintia.tudominio.com
NODE_ENV=production

# 2. Levantar los contenedores
docker compose up -d --build
```

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS.
- **Base de datos:** PostgreSQL, Prisma ORM, PGlite (driver embebido de desarrollo).
- **IA & NLP:** OpenRouter API (compatible OpenAI tools).
- **Mensajería:** `@whiskeysockets/baileys` para WhatsApp Web Multi-Device.
- **Seguridad:** Cifrado simétrico AES-256-GCM para credenciales, hashing bcrypt y tokens JWT firmados con jose.
