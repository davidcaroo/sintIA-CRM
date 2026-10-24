import { db } from "../src/lib/db";
import { sendGmailEmail } from "../src/lib/integrations/google/gmail";
import { getWhatsAppCreds, isWindowOpen, metaErrorMessage, sendWhatsAppTemplate, sendWhatsAppText } from "../src/lib/whatsapp/cloud";

export function initScheduler() {
  console.log("⏰ [Scheduler] Tareas programadas inicializadas (Recordatorios WhatsApp y Resumen Diario).");

  // Comprobar cada 60 segundos
  setInterval(async () => {
    try {
      await checkAppointmentReminders();
      await checkDailySummaryEmail();
    } catch (err) {
      console.error("Error en tareas programadas:", err);
    }
  }, 60000);
}

/**
 * Recordatorio automático por WhatsApp el día antes de cada cita creada por el asistente
 */
async function checkAppointmentReminders() {
  const creds = await getWhatsAppCreds();
  if (!creds) return;

  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  // Buscar citas de mañana que no tengan recordatorio enviado
  const pendingAppointments = await db.appointment.findMany({
    where: {
      startTime: {
        gte: tomorrowStart,
        lte: tomorrowEnd,
      },
      status: "scheduled",
      reminderSent: false,
    },
    include: { contact: true },
  });

  if (!pendingAppointments.length) return;
  const business = await db.businessInfo.findFirst();
  const timeZone = business?.timezone || "America/Bogota";

  for (const app of pendingAppointments) {
    if (!app.contact?.phone) continue;

    const hora = new Date(app.startTime).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    });

    const reminderText = `¡Cordial saludo, ${app.contact.name || "estimado paciente"}! Le recordamos con gusto su cita de *${app.serviceName}* programada para mañana a las *${hora}* en ${business?.name || "nuestro centro"}${business?.address ? ` (${business.address})` : ""}. Si requiere reprogramarla o tiene alguna inquietud, puede responder con confianza a este mensaje. ¡Será un placer atenderle!`;

    // Ventana de 24 h: dentro, texto libre; fuera, solo plantilla aprobada por Meta
    const lastInbound = await db.message.findFirst({
      where: { sender: "client", conversation: { contactId: app.contactId, channel: "whatsapp" } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const windowOpen = isWindowOpen(lastInbound?.createdAt);
    if (!windowOpen && !creds.reminderTemplate) {
      await db.appointment.update({ where: { id: app.id }, data: { reminderSent: true } });
      await db.activityLog.create({
        data: {
          action: "reminder_skipped",
          channel: "whatsapp",
          details: `Recordatorio no enviado a ${app.contact.name} (${app.contact.phone}): pasaron más de 24 h desde su último mensaje y no hay plantilla de recordatorio configurada en Canales.`,
          status: "warning",
        },
      });
      continue;
    }

    try {
      if (windowOpen) {
        await sendWhatsAppText(app.contact.phone, reminderText, creds);
      } else {
        // Variables de la plantilla: {{1}} nombre, {{2}} servicio, {{3}} hora
        await sendWhatsAppTemplate(
          app.contact.phone,
          creds.reminderTemplate!,
          creds.reminderTemplateLang || "es",
          [app.contact.name || "cliente", app.serviceName, hora],
          creds
        );
      }
      await db.appointment.update({
        where: { id: app.id },
        data: { reminderSent: true },
      });

      await db.activityLog.create({
        data: {
          action: "reminder_sent",
          channel: "whatsapp",
          details: `Recordatorio de cita enviado por WhatsApp a ${app.contact.name} (${app.contact.phone}).`,
          status: "success",
        },
      });

      console.log(`📩 [Scheduler] Recordatorio enviado a ${app.contact.phone} para cita de las ${hora}h`);
    } catch (err) {
      console.warn(`Error enviando recordatorio a ${app.contact.phone}:`, metaErrorMessage(err));
    }
  }
}

/**
 * Resumen diario al dueño de la clínica vía Gmail
 */
let lastSummaryDateSent = "";

async function checkDailySummaryEmail() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const todayStr = now.toISOString().slice(0, 10);

  // Enviar a las 20:30 de la tarde una vez al día
  if (currentHour === 20 && currentMinute >= 30 && lastSummaryDateSent !== todayStr) {
    const gmailIntegration = await db.integration.findUnique({ where: { id: "google_gmail" } });
    if (!gmailIntegration || !gmailIntegration.isConnected) return;

    const adminUser = await db.user.findFirst({ where: { role: "admin" } });
    const ownerEmail = adminUser?.email || process.env.ADMIN_EMAIL;
    if (!ownerEmail) return;

    console.log(`📊 [Scheduler] Generando resumen diario para ${ownerEmail}...`);

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [convsToday, appointmentsToday, pendingHandoffs] = await Promise.all([
      db.conversation.count({ where: { createdAt: { gte: startOfToday } } }),
      db.appointment.count({ where: { createdAt: { gte: startOfToday } } }),
      db.conversation.count({ where: { status: "human_handoff" } }),
    ]);

    const summaryText = `Resumen Diario de Actividad — Sintia
Clínica Dental Lumen (Cartagena de Indias, Bolívar)
Fecha: ${now.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}

Resumen de la jornada de atención:
• Conversaciones atendidas hoy: ${convsToday}
• Citas agendadas por Sintia: ${appointmentsToday}
• Conversaciones pendientes de atención por el equipo: ${pendingHandoffs}

Puede revisar todas las conversaciones y citas ingresando al panel de control: ${process.env.APP_URL || "http://localhost:3000"}

— Sintia, Asistente de IA para Negocios`;

    try {
      await sendGmailEmail({
        to: ownerEmail,
        subject: `Resumen diario de actividad — Clínica Dental Lumen (${now.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })})`,
        bodyText: summaryText,
      });

      lastSummaryDateSent = todayStr;

      await db.activityLog.create({
        data: {
          action: "daily_summary_email",
          integrationId: "google_gmail",
          channel: "system",
          details: `Resumen diario enviado al dueño (${ownerEmail}).`,
          status: "success",
        },
      });

      console.log(`✅ [Scheduler] Resumen diario enviado a ${ownerEmail}.`);
    } catch (err) {
      console.error("Error al enviar resumen diario:", err);
    }
  }
}
