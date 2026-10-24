# Especificación Técnica: Modelo de Datos y Cifrado (`specs/database-schema.md`)

## 1. Motor de Base de Datos
- **Entorno de Producción / Contenedores:** PostgreSQL 15+.
- **Entorno Local de Desarrollo (Zero-Setup):** PGlite con `@electric-sql/pglite-socket` escuchando en el puerto TCP `5433` (`scripts/db-runner.ts`).
- **ORM:** Prisma 5.22 con dialecto `postgresql`.

---

## 2. Diagrama de Entidad-Relación y Tablas

```
  ┌──────────────┐          ┌────────────────────┐
  │   Contact    │ 1 ──── * │    Conversation    │
  ├──────────────┤          ├────────────────────┤
  │ id           │          │ id                 │
  │ name         │          │ channel (wa/web)   │
  │ phone        │          │ status             │
  │ email        │          │ lastMessageAt      │
  └──────────────┘          └─────────┬──────────┘
         │ 1                          │ 1
         │                            │
         │ *                          │ *
  ┌──────▼───────┐          ┌─────────▼──────────┐
  │ Appointment  │          │      Message       │
  ├──────────────┤          ├────────────────────┤
  │ id           │          │ id                 │
  │ serviceName  │          │ sender (client/ai) │
  │ startTime    │          │ text               │
  │ reminderSent │          │ toolsUsed (JSON)   │
  └──────────────┘          └────────────────────┘
```

### 2.1 Tablas Clave

| Tabla | Propósito | Notas |
| :--- | :--- | :--- |
| **`User`** | Usuarios del panel (administradores y equipo) | Contraseñas con hash `bcrypt` (10 rounds). |
| **`BusinessInfo`** | Datos de marca, horario general y zona horaria | Singleton (`id: "default"`), almacena la zona horaria (`America/Bogota`). |
| **`AssistantConfig`** | Personalidad del bot, tono, reglas inviolables y modelo | Contiene `welcomeMessage`, `neverDoRules` y modelo por defecto. |
| **`Service`** | Catálogo oficial de tratamientos y precios | Moneda en Pesos Colombianos (`$ COP`) con banderas `isFromPrice` y `requiresValuation`. |
| **`Faq`** | Base de conocimiento para preguntas frecuentes | Preguntas y respuestas indexadas para enriquecer el prompt del modelo. |
| **`Integration`** | Estado y configuración de servicios externos | Guarda `accessToken` y `refreshToken` cifrados con `AES-256-GCM`. |
| **`ChannelState`** | Estado de conexión de WhatsApp | Singleton (`id: "whatsapp"`), contiene el QR actual y número vinculado. |
| **`ActivityLog`** | Registro de auditoría de herramientas e integraciones | Guarda acciones, canal, resultado (`success`/`error`) y tiempo de respuesta. |

---

## 3. Protocolo de Cifrado (`src/lib/crypto.ts`)

Los secretos de integraciones (claves de Stripe, tokens de Google OAuth, webhooks de Slack) **nunca** se guardan en texto plano en la base de datos:

- **Algoritmo:** `AES-256-GCM` (Galois/Counter Mode con autenticación integrada).
- **Clave Criptográfica:** Variable de entorno `ENCRYPTION_KEY` (clave simétrica de 32 bytes).
- **Vector de Inicialización (IV):** 16 bytes aleatorios generados de forma independiente por cada operación mediante `crypto.randomBytes(16)`.
- **Formato Almacenado:** `iv:authTag:encryptedPayload` (en codificación hexadecimal).
