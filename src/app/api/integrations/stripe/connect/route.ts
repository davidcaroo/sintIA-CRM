import { NextRequest, NextResponse } from "next/server";
import { validateStripeKey } from "@/lib/integrations/stripe";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, config } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "Introduce la clave de Stripe." }, { status: 400 });
    }

    const check = await validateStripeKey(apiKey.trim());
    if (!check.valid) {
      return NextResponse.json({ error: check.error || "Clave de Stripe no válida." }, { status: 400 });
    }

    const encrypted = encrypt(apiKey.trim());

    await db.integration.upsert({
      where: { id: "stripe" },
      update: {
        isConnected: true,
        status: "connected",
        statusMessage: `Conectada en modo ${check.isTestMode ? "PRUEBA (Testmode)" : "PRODUCCIÓN"}`,
        encryptedCredentials: encrypted,
        config: config || {},
      },
      create: {
        id: "stripe",
        name: "Stripe",
        category: "Pagos y Señales",
        isConnected: true,
        status: "connected",
        statusMessage: `Conectada en modo ${check.isTestMode ? "PRUEBA (Testmode)" : "PRODUCCIÓN"}`,
        encryptedCredentials: encrypted,
        config: config || {},
      },
    });

    await db.activityLog.create({
      data: {
        action: "stripe_connected",
        integrationId: "stripe",
        details: `Stripe conectado con éxito (${check.isTestMode ? "Modo Prueba" : "Modo Producción"}).`,
        status: "success",
      },
    });

    return NextResponse.json({
      success: true,
      isTestMode: check.isTestMode,
    });
  } catch (error: any) {
    console.error("Error conectando Stripe:", error);
    return NextResponse.json({ error: error.message || "Error al conectar Stripe." }, { status: 500 });
  }
}
