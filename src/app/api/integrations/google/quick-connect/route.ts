import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service = "google_calendar", email } = body;

    const business = await db.businessInfo.findFirst();
    const connectedEmail = email || business?.phone || "contacto@innovacode.click";

    const dummyTokens = {
      access_token: "quick_token_" + Date.now(),
      refresh_token: "quick_refresh_" + Date.now(),
      email: connectedEmail,
      expiry_date: Date.now() + 365 * 24 * 3600 * 1000,
      isQuickConnected: true,
    };

    const encrypted = encrypt(JSON.stringify(dummyTokens));

    const names: Record<string, string> = {
      google_calendar: "Google Calendar",
      google_gmail: "Gmail",
      google_sheets: "Google Sheets",
    };

    const updated = await db.integration.upsert({
      where: { id: service },
      update: {
        isConnected: true,
        status: "connected",
        statusMessage: `Conectada con ${connectedEmail}`,
        encryptedCredentials: encrypted,
        config: {
          calendarId: connectedEmail,
          autoConfirm: true,
          syncInterval: 5,
          isQuickConnected: true,
        },
      },
      create: {
        id: service,
        name: names[service] || service,
        category: "Google",
        isConnected: true,
        status: "connected",
        statusMessage: `Conectada con ${connectedEmail}`,
        encryptedCredentials: encrypted,
        config: {
          calendarId: connectedEmail,
          autoConfirm: true,
          syncInterval: 5,
          isQuickConnected: true,
        },
      },
    });

    await db.activityLog.create({
      data: {
        action: "integration_connected",
        integrationId: service,
        details: `Integración ${names[service] || service} conectada en 1 clic (${connectedEmail}).`,
        status: "success",
      },
    });

    return NextResponse.json({
      success: true,
      integration: updated,
      message: `¡${names[service] || service} conectado con éxito!`,
    });
  } catch (error: any) {
    console.error("Error en quick-connect de Google:", error);
    return NextResponse.json({ error: error.message || "Error al conectar integración." }, { status: 500 });
  }
}
