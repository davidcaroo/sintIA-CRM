import { getValidAccessToken } from "./oauth";
import { db } from "../../db";

export interface CalendarEventPayload {
  service: string;
  customerName: string;
  customerPhone?: string;
  startTime: string; // ISO
  endTime: string; // ISO
}

/**
 * Obtiene la lista de calendarios de la cuenta
 */
export async function listUserCalendars(): Promise<any[]> {
  const token = await getValidAccessToken("google_calendar");
  const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Error al listar calendarios: ${await res.text()}`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Crea un evento en el calendario de Google
 */
export async function createGoogleCalendarEvent(payload: CalendarEventPayload): Promise<any> {
  const token = await getValidAccessToken("google_calendar");
  const integration = await db.integration.findUnique({ where: { id: "google_calendar" } });
  const config = (integration?.config as any) || {};
  const calendarId = config.calendarId || "primary";

  const business = await db.businessInfo.findFirst();
  const businessName = business?.name || "Clínica Dental Lumen";
  const timezone = business?.timezone || "America/Bogota";

  const eventBody = {
    summary: `${payload.service} — ${payload.customerName}`,
    description: `Paciente: ${payload.customerName}\nTeléfono: ${payload.customerPhone || "No especificado"}\nTratamiento: ${payload.service}\n\nCreada por Sintia`,
    start: {
      dateTime: payload.startTime,
      timeZone: timezone,
    },
    end: {
      dateTime: payload.endTime,
      timeZone: timezone,
    },
    reminders: {
      useDefault: true,
    },
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error creando evento en Google Calendar: ${errorText}`);
  }

  return res.json();
}
