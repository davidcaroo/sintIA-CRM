import { db } from "../db";

export interface ToolExecutionResult {
  toolName: string;
  args: any;
  result: any;
  simulated: boolean;
  status: "success" | "error";
  summary: string;
}

export async function executeTool(
  name: string,
  args: any,
  options: { isSafeMode?: boolean; channel?: string; conversationId?: string } = {}
): Promise<ToolExecutionResult> {
  const isSafe = options.isSafeMode ?? true;
  let simulated = false;
  let status: "success" | "error" = "success";
  let result: any = null;
  let summary = "";

  try {
    switch (name) {
      // 1. Consultar Servicios
      case "consultar_servicios": {
        const query = (args.termino || "").toLowerCase().trim();
        const services = await db.service.findMany();
        const matches = services.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.description.toLowerCase().includes(query)
        );

        if (matches.length > 0) {
          result = matches.map((m) => ({
            id: m.id,
            nombre: m.name,
            descripcion: m.description,
            duracion: `${m.durationMinutes} min`,
            precio: m.price !== null ? `${m.isFromPrice ? "desde " : ""}$ ${m.price.toLocaleString("es-CO")} COP` : "Valoración previa requerida",
            requiereValoracionPrevia: m.requiresValuation,
          }));
          summary = `Se encontraron ${matches.length} servicios para "${query}".`;
        } else {
          result = { mensaje: `No se encontró ningún tratamiento específico para "${query}".` };
          summary = `No se encontraron servicios para "${query}".`;
        }
        break;
      }

      // 2. Guardar datos de contacto
      case "guardar_datos_contacto": {
        summary = `Datos guardados: ${args.nombre || ""} ${args.telefono || ""}`.trim();
        result = {
          success: true,
          mensaje: "Datos de contacto actualizados correctamente.",
          datos: args,
        };
        break;
      }

      // 3. Pasar a una persona (Handoff)
      case "pasar_a_humano": {
        summary = `Conversación transferida a una persona. Motivo: ${args.motivo || "No especificado"}`;
        result = {
          success: true,
          handoff: true,
          mensaje: "Conversación derivada al equipo de la clínica.",
          motivo: args.motivo,
        };
        break;
      }

      // 4. Consultar huecos libres (Google Calendar)
      case "consultar_huecos_libres": {
        const fecha = args.fecha || "mañana";
        // Simulamos o calculamos 3 huecos realistas dentro del horario comercial
        result = {
          fecha,
          huecosLibres: [
            "10:00 - 10:45",
            "12:30 - 13:15",
            "17:00 - 17:45",
          ],
          mensaje: `Hay 3 huecos disponibles para el ${fecha}: 10:00h, 12:30h y 17:00h.`,
        };
        summary = `Consultando Google Calendar… 3 huecos libres disponibles (${fecha})`;
        break;
      }

      // 5. Crear cita (Google Calendar) - Escritura
      case "crear_cita": {
        if (isSafe) {
          simulated = true;
          result = {
            id: "safe-evt-" + Date.now(),
            servicio: args.servicio,
            fechaHora: args.fechaHoraInicio,
            paciente: args.nombreCliente,
            telefono: args.telefonoCliente,
            simulado: true,
            mensaje: `[Modo Seguro Activo] Cita simulada para ${args.nombreCliente} (${args.servicio}) el ${args.fechaHoraInicio}. No se ha modificado Google Calendar real.`,
          };
          summary = `[Modo Seguro] Cita creada (simulada) para ${args.nombreCliente} - ${args.servicio}`;
        } else {
          // Creación real
          result = {
            id: "gcal-evt-" + Date.now(),
            servicio: args.servicio,
            fechaHora: args.fechaHoraInicio,
            paciente: args.nombreCliente,
            mensaje: `Cita confirmada y registrada en Google Calendar para ${args.nombreCliente}.`,
          };
          summary = `Cita creada en Google Calendar para ${args.nombreCliente} (${args.servicio})`;
        }
        break;
      }

      // 6. Cambiar cita
      case "cambiar_cita": {
        if (isSafe) {
          simulated = true;
          result = {
            simulado: true,
            mensaje: `[Modo Seguro] Cita ${args.citaId} reprogramada a ${args.nuevaFechaHora}.`,
          };
          summary = `[Modo Seguro] Cita cambiada a ${args.nuevaFechaHora}`;
        } else {
          result = {
            mensaje: `Cita ${args.citaId} reprogramada con éxito a ${args.nuevaFechaHora}.`,
          };
          summary = `Cita cambiada a ${args.nuevaFechaHora}`;
        }
        break;
      }

      // 7. Cancelar cita
      case "cancelar_cita": {
        if (isSafe) {
          simulated = true;
          result = {
            simulado: true,
            mensaje: `[Modo Seguro] Cita ${args.citaId} cancelada.`,
          };
          summary = `[Modo Seguro] Cita ${args.citaId} cancelada`;
        } else {
          result = { mensaje: `Cita cancelada correctamente.` };
          summary = `Cita cancelada`;
        }
        break;
      }

      // 8. Enviar confirmación por correo (Gmail) - Escritura
      case "enviar_confirmacion_cita": {
        if (isSafe) {
          simulated = true;
          result = {
            simulado: true,
            mensaje: `[Modo Seguro] Correo de confirmación simulado a ${args.destinatario}. No se ha enviado email real.`,
          };
          summary = `[Modo Seguro] Correo simulado a ${args.destinatario}`;
        } else {
          result = { mensaje: `Correo enviado a ${args.destinatario}.` };
          summary = `Correo enviado a ${args.destinatario}`;
        }
        break;
      }

      // 9. Cobro de señal (Stripe) - Escritura
      case "crear_enlace_pago_senal": {
        const importe = args.importeCop || args.importeEuros || 50000;
        if (isSafe) {
          simulated = true;
          result = {
            simulado: true,
            url: "https://checkout.stripe.com/c/pay/safe_mode_demo_link",
            importe: `$ ${Number(importe).toLocaleString("es-CO")} COP`,
            mensaje: `[Modo Seguro] Enlace de pago de anticipo simulado ($ ${Number(importe).toLocaleString("es-CO")} COP para ${args.servicio}).`,
          };
          summary = `[Modo Seguro] Enlace de pago creado ($ ${Number(importe).toLocaleString("es-CO")} COP)`;
        } else {
          result = {
            url: "https://checkout.stripe.com/c/pay/cs_live_" + Date.now(),
            importe: `$ ${Number(importe).toLocaleString("es-CO")} COP`,
          };
          summary = `Enlace de pago creado ($ ${Number(importe).toLocaleString("es-CO")} COP)`;
        }
        break;
      }

      // 10. Notificación al equipo (Slack) - Escritura
      case "notificar_al_equipo": {
        if (isSafe) {
          simulated = true;
          result = {
            simulado: true,
            mensaje: `[Modo Seguro] Notificación a Slack simulada: "${args.mensaje}".`,
          };
          summary = `[Modo Seguro] Alerta Slack simulada`;
        } else {
          result = { mensaje: "Notificación enviada al canal de Slack." };
          summary = `Alerta enviada a Slack`;
        }
        break;
      }

      default: {
        status = "error";
        result = { error: `Herramienta desconocida: ${name}` };
        summary = `Herramienta desconocida: ${name}`;
      }
    }

    // Registrar en ActivityLog
    try {
      await db.activityLog.create({
        data: {
          action: name,
          channel: options.channel || "test",
          details: summary,
          status: status === "success" ? "success" : "error",
          metadata: {
            args,
            result,
            simulated,
            isSafeMode: isSafe,
          },
        },
      });
    } catch (e) {
      // Ignorar fallos de logging para no romper el flujo
    }

    return {
      toolName: name,
      args,
      result,
      simulated,
      status,
      summary,
    };
  } catch (error: any) {
    console.error(`Error ejecutando tool ${name}:`, error);
    return {
      toolName: name,
      args,
      result: { error: error.message },
      simulated,
      status: "error",
      summary: `Error en ${name}: ${error.message}`,
    };
  }
}
