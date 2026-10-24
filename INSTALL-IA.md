# 🤖 Protocolo de Instalación y Despliegue para Agentes de IA (`INSTALL-IA.md`)

Este documento está diseñado para ser interpretado y ejecutado por **cualquier Agente de IA** (Claude Code, Antigravity, OpenAI Codex, Gemini CLI, Cursor, Windsurf o scripts de automatización).

Cuando un usuario te solicite: *"Instala Sintia en mi servidor"*, *"Despliega este CRM"* o *"Configura el asistente para mi negocio"*, debes seguir estrictamente este flujo de 3 pasos sin desviarte.

---

## 📋 FASE 1: Las 3 Preguntas de Calificación (Interacción con el Usuario)

Haz **únicamente estas 3 preguntas agrupadas** al usuario antes de tocar cualquier archivo o ejecutar comandos:

1. **Datos del Negocio:**
   > "¿Cuál es el nombre de tu negocio, ciudad/país, teléfono de contacto y a qué actividad se dedica exactamente?"
2. **Servicios y Precios:**
   > "¿Cuáles son tus 2 o 3 servicios o productos principales, sus precios estimados (en tu moneda local) y si requieren valoración previa o anticipo para agendar cita?"
3. **Plataforma de Despliegue:**
   > "¿Dónde deseas desplegar Sintia? Elige una opción:
   > - **A) Coolify** (VPS propio con Docker y SSL automático)
   > - **B) Docker / Docker Compose** (VPS en Hostinger, Hetzner, DigitalOcean o Servidor Local)
   > - **C) Railway** (PaaS en la nube en 1 clic)"

---

## ⚙️ FASE 2: Generación Automática del Entorno (`.env`)

Con las respuestas del usuario y las credenciales que posea, genera el archivo `.env` en la raíz del proyecto basándote en esta plantilla determinista:

```bash
# ==============================================================================
# SINTIA CRM — CONFIGURACIÓN GENERADA POR AGENTE DE IA
# ==============================================================================

# 1. URL PÚBLICA Y PUERTO
APP_URL="https://tu-dominio.com"   # O http://localhost:3000 si es en local
PORT=3000

# 2. BASE DE DATOS POSTGRESQL
# En Coolify/Docker compose estándar: postgresql://sintia:sintia_secret_pass@postgres:5432/sintia
# En Railway: Usar la variable proporcionada por el plugin PostgreSQL (${{Postgres.DATABASE_URL}})
DATABASE_URL="postgresql://sintia:sintia_secret_pass@127.0.0.1:5432/sintia"

# 3. SEGURIDAD Y CIFRADO (Generar claves aleatorias de 32 bytes)
# El agente puede generar una cadena hexadecimal de 64 caracteres para cada una
SESSION_SECRET="generar_cadena_hexadecimal_aleatoria_de_64_caracteres"
ENCRYPTION_KEY="generar_clave_hexadecimal_de_32_bytes_para_aes256"

# 4. ACCESO INICIAL DEL ADMINISTRADOR
ADMIN_EMAIL="admin@tu-dominio.com"
ADMIN_PASSWORD="PasswordSeguro2026!"

# 5. INTELIGENCIA ARTIFICIAL (OpenRouter)
OPENROUTER_API_KEY="sk-or-v1-tu-clave-aqui"
DEFAULT_MODEL="anthropic/claude-haiku-5.5"

# 6. CANAL WHATSAPP (Baileys)
WHATSAPP_SESSION_DIR="./whatsapp-session"

# 7. ZONA HORARIA LOCAL (Ej: America/Bogota, Europe/Madrid, America/Mexico_City)
DEFAULT_TIMEZONE="America/Bogota"
```

---

## 🚀 FASE 3: Instrucciones de Despliegue según la Plataforma Elegida

### Opción A: Despliegue en **Coolify** (Recomendado para Agencias y VPS)
Coolify detecta automáticamente la configuración multi-contenedor mediante Docker Compose.

1. **Crear Nuevo Servicio en Coolify:**
   - En el panel de Coolify, ve a **Projects > New Resource > Docker Compose**.
   - Conecta el repositorio de GitHub: `https://github.com/davidcaroo/sintIA-CRM`.
2. **Variables de Entorno:**
   - Pega las variables generadas en la Fase 2 en la sección **Environment Variables** de Coolify.
   - Asegúrate de definir `APP_URL=https://tudominio.com` y vincular el dominio en el puerto 3000.
3. **Persistencia de Volúmenes (Crucial para WhatsApp):**
   - Asegúrate de que el volumen `./whatsapp-session` esté mapeado a `/app/whatsapp-session` para que la vinculación del QR sobreviva a reinicios.
4. **Desplegar:**
   - Haz clic en **Deploy**. Coolify ejecutará el `Dockerfile` multi-etapa, migrará la base de datos y levantará `web` y `worker`.

---

### Opción B: Despliegue con **Docker Compose** en VPS (Hostinger / Hetzner / Ubuntu)
El agente debe ejecutar estos comandos en el servidor del usuario:

```bash
# 1. Clonar el repositorio
git clone https://github.com/davidcaroo/sintIA-CRM.git /opt/sintia
cd /opt/sintia

# 2. Crear archivo .env con las variables de la Fase 2
nano .env

# 3. Levantar los contenedores (PostgreSQL, Web y Worker de WhatsApp)
docker compose up -d --build

# 4. Verificar logs de arranque
docker compose logs -f web worker
```

El script [`scripts/entrypoint.sh`](file:///c:/Users/Ingca/OneDrive/Documentos/Asistente de IA%20-%20Antigravity/scripts/entrypoint.sh) ejecutará automáticamente:
1. `npx prisma db push --skip-generate`
2. Si `SEED_DEMO=true`, creará el usuario administrador y datos iniciales.
3. Iniciará concurrentemente el servidor Next.js y el worker de Baileys.

---

### Opción C: Despliegue en **Railway**
1. **Crear Proyecto en Railway:**
   - Selecciona **Deploy from GitHub repo** y elige `davidcaroo/sintIA-CRM`.
2. **Agregar Base de Datos PostgreSQL:**
   - Añade el servicio **Add Plugin > PostgreSQL**.
   - Vincula la variable `DATABASE_URL=${{Postgres.DATABASE_URL}}` en las variables del servicio Sintia.
3. **Agregar Variables Restantes:**
   - Agrega `OPENROUTER_API_KEY`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
4. **Montar Volumen de Sesión de WhatsApp:**
   - En Railway, ve a **Settings > Volumes > Add Volume**.
   - Mount Path: `/app/whatsapp-session` (evita desvinculaciones de WhatsApp en cada despliegue).

---

## 🎯 FASE 4: Verificación Post-Instalación que el Agente Debe Ejecutar

Una vez desplegado el sistema, el agente debe verificar:
1. **Acceso al Panel:** Visitar `$APP_URL/login` y comprobar código HTTP `200`.
2. **Login del Administrador:** Iniciar sesión con `$ADMIN_EMAIL` y `$ADMIN_PASSWORD`.
3. **Vinculación de WhatsApp:** Abrir `$APP_URL/canales`, confirmar que el código QR aparezca y solicitar al usuario escanearlo desde su celular en `WhatsApp > Dispositivos vinculados`.
4. **Comprobar el Asistente:** Enviar un mensaje de prueba al número de WhatsApp o en el chat web de `$APP_URL/demo`.
