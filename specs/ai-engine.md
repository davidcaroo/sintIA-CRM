# Especificación Técnica: Motor de IA y Herramientas (`specs/ai-engine.md`)

## 1. Conexión con OpenRouter (`src/lib/ai/openrouter.ts`)

Sintia utiliza la API de **OpenRouter** compatible con la especificación de OpenAI (`https://openrouter.ai/api/v1/chat/completions`) para acceder a múltiples familias de modelos (Anthropic, OpenAI, Google, Meta).

### 1.1 Cabeceras Obligatorias
Toda solicitud HTTP saliente debe incluir:
```typescript
headers: {
  "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
  "X-Title": "Sintia",
  "Content-Type": "application/json"
}
```

### 1.2 Mecanismo de Fallback Automático
Si el modelo configurado por el usuario no responde, genera un error `429` (Rate limit) o `503` (Overloaded), el cliente captura la excepción, registra la advertencia en `ActivityLog` y reintenta la misma conversación **exactamente una vez con el modelo recomendado por defecto** (`anthropic/claude-haiku-5.5`).

---

## 2. Compilador del Prompt del Sistema (`src/lib/prompt-builder.ts`)

El prompt no está hardcodeado, sino que se ensambla dinámicamente antes de cada invocación a partir de la base de datos:

1. **Contexto Temporal:** Fecha, día de la semana y hora exacta en la zona horaria del negocio (`America/Bogota`).
2. **Información del Negocio:** Nombre, actividad comercial, dirección física en Cartagena de Indias y teléfono de contacto.
3. **Catálogo de Servicios:** Lista completa con duración, precio en pesos colombianos (`$ COP`) y si requiere valoración previa.
4. **Base de Conocimiento y FAQs:** Respuestas a preguntas habituales.
5. **Reglas Inviolables (`neverDoRules`):** Restricciones prioritarias (no inventar precios, no emitir diagnósticos médicos, derivar urgencias).
6. **Políticas de Handoff a Humano:** Detección de quejas, peticiones explícitas de hablar con un asesor o dudas complejas no documentadas.

---

## 3. Catálogo de Herramientas (Function Calling)

Las herramientas registradas en [`src/lib/ai/tools.ts`](file:///c:/Users/Ingca/OneDrive/Documentos/Asistente de IA%20-%20Antigravity/src/lib/ai/tools.ts) son invocadas determinísticamente por el modelo:

| Nombre de la Herramienta | Tipo | Descripción |
| :--- | :--- | :--- |
| `consultar_servicios` | Lectura | Filtra tratamientos y tarifas por palabra clave. |
| `consultar_huecos_libres` | Lectura | Consulta disponibilidad en Google Calendar dentro del horario comercial. |
| `crear_cita` | Escritura | Registra una cita médica/comercial en Google Calendar. |
| `cambiar_cita` | Escritura | Reprograma una cita existente a una nueva fecha/hora. |
| `cancelar_cita` | Escritura | Cancela un evento de cita en el calendario. |
| `enviar_confirmacion_cita`| Escritura | Envía un correo con los detalles de la cita mediante Gmail API. |
| `crear_enlace_pago_senal` | Escritura | Genera una sesión de pago en Stripe para cobrar anticipos de reserva. |
| `notificar_al_equipo` | Escritura | Emite una alerta de urgencia o recado al canal de Slack del equipo. |
| `pasar_a_humano` | Control | Silencia el bot en la conversación y activa el estado `human_handoff`. |

### Modo Seguro (`isSafeMode`)
En la pantalla de prueba ([`/probar`](http://localhost:3000/probar)), si el interruptor "Modo Seguro" está activo, las herramientas de tipo *Escritura* devuelven una simulación exitosa sin llamar a las APIs reales de Google Calendar, Gmail, Stripe o Slack, garantizando que el usuario pueda probar el flujo sin alterar datos de producción.
