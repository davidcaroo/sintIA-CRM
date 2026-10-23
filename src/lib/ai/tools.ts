import { db } from "../db";

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

/**
 * Retorna las herramientas disponibles para el asistente
 */
export async function getAvailableTools(isSafeMode = false): Promise<ToolDefinition[]> {
  const tools: ToolDefinition[] = [
    // 1. Siempre disponibles
    {
      type: "function",
      function: {
        name: "consultar_servicios",
        description:
          "Consulta el catálogo de tratamientos o servicios de la clínica por término de búsqueda (ej: 'limpieza', 'ortodoncia', 'blanqueamiento') para conocer precios, duración y condiciones.",
        parameters: {
          type: "object",
          properties: {
            termino: {
              type: "string",
              description: "Término o nombre del tratamiento a buscar.",
            },
          },
          required: ["termino"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "guardar_datos_contacto",
        description:
          "Guarda o actualiza los datos personales facilitados por el cliente (nombre completo, teléfono, correo electrónico, o notas de interés).",
        parameters: {
          type: "object",
          properties: {
            nombre: { type: "string", description: "Nombre y apellidos del cliente." },
            telefono: { type: "string", description: "Número de teléfono con prefijo si está disponible." },
            email: { type: "string", description: "Correo electrónico del cliente." },
            interes: { type: "string", description: "Tratamiento o motivo principal por el que contacta." },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "pasar_a_humano",
        description:
          "Transfiere de inmediato la conversación a una persona del equipo humano de la clínica (por queja, urgencia severa, petición explícita o falta de datos).",
        parameters: {
          type: "object",
          properties: {
            motivo: {
              type: "string",
              description: "Razón detallada por la que se deriva a una persona.",
            },
          },
          required: ["motivo"],
        },
      },
    },

    // 2. Herramientas de Citas y Calendario (Google Calendar)
    {
      type: "function",
      function: {
        name: "consultar_huecos_libres",
        description:
          "Consulta los huecos libres disponibles en la agenda para una fecha determinada dentro del horario de atención de la clínica.",
        parameters: {
          type: "object",
          properties: {
            fecha: {
              type: "string",
              description: "Fecha a consultar en formato YYYY-MM-DD (ej: '2026-10-24').",
            },
            duracionMinutos: {
              type: "number",
              description: "Duración requerida en minutos (por defecto 30).",
            },
          },
          required: ["fecha"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "crear_cita",
        description:
          "Crea una nueva cita en la agenda de la clínica. IMPORTANTE: Confirma siempre día, hora y tratamiento con el paciente antes de llamar a esta herramienta.",
        parameters: {
          type: "object",
          properties: {
            servicio: { type: "string", description: "Nombre del servicio o tratamiento." },
            fechaHoraInicio: {
              type: "string",
              description: "Fecha y hora de inicio en formato ISO 8601 (ej: '2026-10-24T10:00:00+02:00').",
            },
            nombreCliente: { type: "string", description: "Nombre del paciente." },
            telefonoCliente: { type: "string", description: "Teléfono del paciente." },
          },
          required: ["servicio", "fechaHoraInicio", "nombreCliente"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "cambiar_cita",
        description: "Modifica la fecha u hora de una cita previamente concertada.",
        parameters: {
          type: "object",
          properties: {
            citaId: { type: "string", description: "Identificador de la cita." },
            nuevaFechaHora: {
              type: "string",
              description: "Nueva fecha y hora en formato ISO 8601.",
            },
          },
          required: ["citaId", "nuevaFechaHora"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "cancelar_cita",
        description: "Cancela una cita agendada por petición del cliente.",
        parameters: {
          type: "object",
          properties: {
            citaId: { type: "string", description: "Identificador de la cita a cancelar." },
            motivo: { type: "string", description: "Motivo de la cancelación." },
          },
          required: ["citaId"],
        },
      },
    },

    // 3. Herramienta de Correo (Gmail)
    {
      type: "function",
      function: {
        name: "enviar_confirmacion_cita",
        description: "Envía un correo electrónico con los detalles y confirmación de la cita al email del paciente.",
        parameters: {
          type: "object",
          properties: {
            destinatario: { type: "string", description: "Email del paciente." },
            detallesCita: { type: "string", description: "Resumen de la cita (servicio, fecha, hora, dirección de la clínica)." },
          },
          required: ["destinatario", "detallesCita"],
        },
      },
    },

    // 4. Herramienta de Pago de Señal (Stripe)
    {
      type: "function",
      function: {
        name: "crear_enlace_pago_senal",
        description: "Genera un enlace seguro de Stripe para abonar la señal o reserva de un tratamiento.",
        parameters: {
          type: "object",
          properties: {
            servicio: { type: "string", description: "Nombre del tratamiento." },
            importeEuros: { type: "number", description: "Importe de la señal en euros (ej: 20)." },
          },
          required: ["servicio", "importeEuros"],
        },
      },
    },

    // 5. Herramienta de Notificación al Equipo (Slack)
    {
      type: "function",
      function: {
        name: "notificar_al_equipo",
        description: "Envía una notificación urgente al canal de Slack del equipo de la clínica.",
        parameters: {
          type: "object",
          properties: {
            mensaje: { type: "string", description: "Texto de la alerta para el equipo." },
            urgente: { type: "boolean", description: "Si requiere atención inmediata." },
          },
          required: ["mensaje"],
        },
      },
    },
  ];

  return tools;
}
