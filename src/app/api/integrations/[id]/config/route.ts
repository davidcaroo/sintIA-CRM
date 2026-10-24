import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.integration.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Integración no encontrada." }, { status: 404 });
    }

    const currentConfig = (existing.config as any) || {};
    const newConfig = { ...currentConfig, ...body.config };

    let encryptedCreds = existing.encryptedCredentials;
    if (body.credentials) {
      encryptedCreds = encrypt(body.credentials);
    }

    const isNowConnected =
      body.isConnected !== undefined
        ? body.isConnected
        : existing.isConnected || !!body.credentials;

    await db.integration.update({
      where: { id },
      data: {
        config: newConfig,
        encryptedCredentials: encryptedCreds,
        isConnected: isNowConnected,
        status: isNowConnected ? "connected" : "disconnected",
        statusMessage: isNowConnected ? "Configurada y activa" : null,
      },
    });

    // No se devuelve la integración: incluiría las credenciales cifradas
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar config de integración:", error);
    return NextResponse.json({ error: "Error al guardar configuración." }, { status: 500 });
  }
}

// El panel guarda con PUT
export const PUT = POST;
