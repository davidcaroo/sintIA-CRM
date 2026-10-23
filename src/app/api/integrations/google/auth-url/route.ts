import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/integrations/google/oauth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const service = searchParams.get("service") as any;

    if (!service || !["google_calendar", "google_gmail", "google_sheets"].includes(service)) {
      return NextResponse.json({ error: "Servicio de Google no válido." }, { status: 400 });
    }

    const url = getGoogleAuthUrl(service);
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Error generando auth url de Google:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar enlace OAuth." },
      { status: 500 }
    );
  }
}
