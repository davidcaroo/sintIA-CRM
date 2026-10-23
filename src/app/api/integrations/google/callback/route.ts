import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/integrations/google/oauth";
import { createContactsSpreadsheet } from "@/lib/integrations/google/sheets";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "google_calendar";
  const error = searchParams.get("error");

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (error || !code) {
    console.error("Error en Google OAuth callback:", error);
    return NextResponse.redirect(`${appUrl}/integraciones?error=${encodeURIComponent(error || "cancelado")}`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // Guardar credenciales cifradas en la integración
    const encrypted = encrypt(JSON.stringify(tokens));

    let configUpdates: any = {};

    // Si es Google Sheets, crear automáticamente la hoja de contactos
    if (state === "google_sheets") {
      try {
        const sheetResult = await createContactsSpreadsheet();
        configUpdates = {
          spreadsheetId: sheetResult.spreadsheetId,
          spreadsheetUrl: sheetResult.url,
        };
      } catch (sheetErr) {
        console.warn("No se pudo crear automáticamente la hoja de Sheets:", sheetErr);
      }
    }

    const current = await db.integration.findUnique({ where: { id: state } });
    const existingConfig = (current?.config as any) || {};

    await db.integration.upsert({
      where: { id: state },
      update: {
        isConnected: true,
        status: "connected",
        statusMessage: `Conectada con ${tokens.email || "Google"}`,
        encryptedCredentials: encrypted,
        config: { ...existingConfig, ...configUpdates },
      },
      create: {
        id: state,
        name:
          state === "google_calendar"
            ? "Google Calendar"
            : state === "google_gmail"
            ? "Gmail"
            : "Google Sheets",
        category: "Google",
        isConnected: true,
        status: "connected",
        statusMessage: `Conectada con ${tokens.email || "Google"}`,
        encryptedCredentials: encrypted,
        config: configUpdates,
      },
    });

    await db.activityLog.create({
      data: {
        action: "integration_connected",
        integrationId: state,
        details: `Integración ${state} autorizada con éxito con la cuenta ${tokens.email || "Google"}.`,
        status: "success",
      },
    });

    return NextResponse.redirect(`${appUrl}/integraciones?connected=${state}`);
  } catch (err: any) {
    console.error("Error procesando callback de Google:", err);
    return NextResponse.redirect(`${appUrl}/integraciones?error=${encodeURIComponent(err.message)}`);
  }
}
