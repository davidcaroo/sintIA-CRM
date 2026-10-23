import { db } from "../src/lib/db";
import { sendGmailEmail } from "../src/lib/integrations/google/gmail";

export function initScheduler(sockGetter?: any) {
  console.log("⏰ [Scheduler] Tareas programadas inicializadas (Recordatorios WhatsApp y Resumen Diario).");

  // Comprobar cada 60 segundos
  setInterval(async () => {
    try {
      await checkAppointmentReminders(sockGetter);
      await checkDailySummaryEmail();
    } catch (err) {
      console.error("Error en tareas programadas:", err);
    }
  }, 60000);
}

/**
 * Recordatorio automático por WhatsApp el día antes de cada cita creada por el asistente
 */
async function checkAppointmentReminders(sock: any) {
  if (!sock) return;

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

  for (const app of pendingAppointments) {
    if (!app.contact?.phone) continue;

    const jid = `${app.contact.phone.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
    const hora = new Date(app.startTime).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Bogota",
    });

    const reminderText = `¡Cordial saludo, ${app.contact.name || "estimado paciente"}! Le recordamos con gusto su cita de *${app.serviceName}* programada para mañana a las *${hora}* en Clínica Dental Lumen (Carrera 3ra # 6-45, Bocagrande, Cartagena de Indias). Si requiere reprogramarla o tiene alguna inquietud, puede responder con confianza a este mensaje. ¡Será un placer atenderle!`;

    try {
      await sock.sendMessage(jid, { text: reminderText });
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
      console.warn(`Error enviando recordatorio a ${app.contact.phone}:`, err);
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
