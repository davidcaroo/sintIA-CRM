import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getGoogleAuthUrl } from "@/lib/integrations/google/oauth";

export async function POST(req: NextRequest) {
  try {
    const { clientId, clientSecret, service = "google_calendar" } = await req.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Debes proporcionar Client ID y Client Secret de Google Cloud." },
        { status: 400 }
      );
    }

    const envPath = path.resolve(process.cwd(), ".env");
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

    // Actualizar o añadir GOOGLE_CLIENT_ID
    if (envContent.includes("GOOGLE_CLIENT_ID=")) {
      envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*(\r?\n|$)/, `GOOGLE_CLIENT_ID=${clientId.trim()}\n`);
    } else {
      envContent += `\nGOOGLE_CLIENT_ID=${clientId.trim()}\n`;
    }

    // Actualizar o añadir GOOGLE_CLIENT_SECRET
    if (envContent.includes("GOOGLE_CLIENT_SECRET=")) {
      envContent = envContent.replace(/GOOGLE_CLIENT_SECRET=.*(\r?\n|$)/, `GOOGLE_CLIENT_SECRET=${clientSecret.trim()}\n`);
    } else {
      envContent += `GOOGLE_CLIENT_SECRET=${clientSecret.trim()}\n`;
    }

    fs.writeFileSync(envPath, envContent, "utf8");

    // Actualizar proceso actual
    process.env.GOOGLE_CLIENT_ID = clientId.trim();
    process.env.GOOGLE_CLIENT_SECRET = clientSecret.trim();

    // Generar la URL de Google OAuth
    const authUrl = getGoogleAuthUrl(service);

    return NextResponse.json({
      success: true,
      authUrl,
      message: "Credenciales guardadas con éxito. Redirigiendo a Google...",
    });
  } catch (err: any) {
    console.error("Error guardando credenciales de Google:", err);
    return NextResponse.json({ error: err.message || "Error al guardar credenciales." }, { status: 500 });
  }
}
