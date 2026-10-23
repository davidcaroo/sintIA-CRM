import { getValidAccessToken } from "./oauth";
import { db } from "../../db";

/**
 * Crea la hoja de cálculo "Contactos — [Nombre del negocio]" al conectar la integración
 */
export async function createContactsSpreadsheet(): Promise<{ spreadsheetId: string; url: string }> {
  const token = await getValidAccessToken("google_sheets");
  const business = await db.businessInfo.findFirst();
  const businessName = business?.name || "Clínica Dental Lumen";
  const title = `Contactos — ${businessName}`;

  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: { title: "Contactos" },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: "Fecha" } },
                    { userEnteredValue: { stringValue: "Nombre" } },
                    { userEnteredValue: { stringValue: "Teléfono" } },
                    { userEnteredValue: { stringValue: "Canal" } },
                    { userEnteredValue: { stringValue: "Interés" } },
                    { userEnteredValue: { stringValue: "¿Pidió Cita?" } },
                    { userEnteredValue: { stringValue: "Notas" } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Error creando Google Sheet: ${await res.text()}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { spreadsheetId, url };
}

/**
 * Añade una fila de contacto a la hoja de Google Sheets
 */
export async function appendContactToSheet(contact: {
  name?: string;
  phone?: string;
  channel?: string;
  interest?: string;
  askedAppointment?: boolean;
  notes?: string;
}): Promise<any> {
  const token = await getValidAccessToken("google_sheets");
  const integration = await db.integration.findUnique({ where: { id: "google_sheets" } });
  const config = (integration?.config as any) || {};
  const spreadsheetId = config.spreadsheetId;

  if (!spreadsheetId) {
    throw new Error("No hay ninguna hoja de cálculo asociada en la configuración de Google Sheets.");
  }

  const rowValues = [
    new Date().toLocaleDateString("es-ES"),
    contact.name || "Sin nombre",
    contact.phone || "",
    contact.channel || "WhatsApp",
    contact.interest || "",
    contact.askedAppointment ? "Sí" : "No",
    contact.notes || "",
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Contactos!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Error añadiendo contacto a Google Sheets: ${await res.text()}`);
  }

  return res.json();
}
