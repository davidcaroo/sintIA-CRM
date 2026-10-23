import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt, maskToken } from "@/lib/crypto";

export async function GET() {
  try {
    const list = await db.integration.findMany({
      orderBy: { id: "asc" },
    });

    const sanitized = list.map((it) => {
      let connectedAccount: string | null = null;
      let isTestMode = false;

      if (it.encryptedCredentials) {
        try {
          const raw = decrypt(it.encryptedCredentials);
          if (it.id.startsWith("google_")) {
            const parsed = JSON.parse(raw);
            connectedAccount = parsed.email || "Cuenta Google";
          } else if (it.id === "slack") {
            connectedAccount = "Incoming Webhook configurado";
          } else if (it.id === "stripe") {
            isTestMode = raw.startsWith("rk_test_") || raw.startsWith("sk_test_");
            connectedAccount = maskToken(raw);
          } else if (it.id === "webhooks") {
            connectedAccount = "Webhook activo con clave secreta";
          }
        } catch {
          connectedAccount = "Conectada";
        }
      }

      return {
        id: it.id,
        name: it.name,
        category: it.category,
        isConnected: it.isConnected,
        status: it.status,
        statusMessage: it.statusMessage || (it.isConnected ? `Conectada con ${connectedAccount}` : null),
        connectedAccount,
        isTestMode,
        config: it.config || {},
      };
    });

    return NextResponse.json({ integrations: sanitized });
  } catch (error) {
    console.error("Error al obtener integraciones:", error);
    return NextResponse.json({ error: "Error al cargar integraciones." }, { status: 500 });
  }
}
