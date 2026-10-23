import { db } from "../../db";
import { encrypt, decrypt } from "../../crypto";
import { GoogleTokens } from "../types";

export const GOOGLE_SCOPES: Record<string, string[]> = {
  google_calendar: [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  google_gmail: [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  google_sheets: [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
};

export function getGoogleRedirectUri(): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  return `${appUrl}/api/integrations/google/callback`;
}

/**
 * Genera la URL de autorización OAuth con scopes incrementales y acceso offline
 */
export function getGoogleAuthUrl(serviceId: "google_calendar" | "google_gmail" | "google_sheets"): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID no configurado en variables de entorno.");
  }

  const redirectUri = getGoogleRedirectUri();
  const scopes = GOOGLE_SCOPES[serviceId] || [];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: serviceId,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Canjea el código de autorización por tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getGoogleRedirectUri();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId || "",
      client_secret: clientSecret || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error canjeando código de Google: ${errorText}`);
  }

  const tokens = await res.json();

  // Obtener email de la cuenta conectada
  let email = "cuenta-google@gmail.com";
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      email = userData.email || email;
    }
  } catch {
    // Fallback email
  }

  return {
    ...tokens,
    email,
    expiry_date: Date.now() + (tokens.expires_in || 3600) * 1000,
  };
}

/**
 * Obtiene un access_token válido renovándolo con el refresh_token si ha caducado
 */
export async function getValidAccessToken(integrationId: string): Promise<string> {
  const integration = await db.integration.findUnique({
    where: { id: integrationId },
  });

  if (!integration || !integration.encryptedCredentials) {
    throw new Error(`La integración ${integrationId} no está conectada.`);
  }

  const decrypted = decrypt(integration.encryptedCredentials);
  const tokens: GoogleTokens = JSON.parse(decrypted);

  // Si aún no ha caducado (con 2 min de margen), reutilizar
  if (tokens.expiry_date && tokens.expiry_date > Date.now() + 120000) {
    return tokens.access_token;
  }

  // Renovar usando refresh_token
  if (!tokens.refresh_token) {
    throw new Error("No hay refresh_token disponible. Vuelve a conectar la integración.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId || "",
      client_secret: clientSecret || "",
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    // Si Google revocó el token (invalid_grant), marcar la integración en Error
    if (errText.includes("invalid_grant")) {
      await db.integration.update({
        where: { id: integrationId },
        data: {
          status: "error",
          statusMessage: "Token revocado o caducado por Google. Vuelve a conectar la cuenta.",
        },
      });

      await db.activityLog.create({
        data: {
          action: "integration_token_revoked",
          integrationId,
          details: `El token de Google para ${integration.name} fue revocado o caducó.`,
          status: "error",
          error: errText,
        },
      });
    }
    throw new Error(`Error al renovar token de Google: ${errText}`);
  }

  const newTokensData = await res.json();
  const updatedTokens: GoogleTokens = {
    ...tokens,
    access_token: newTokensData.access_token,
    expiry_date: Date.now() + (newTokensData.expires_in || 3600) * 1000,
  };

  // Guardar de nuevo cifrado
  await db.integration.update({
    where: { id: integrationId },
    data: {
      encryptedCredentials: encrypt(JSON.stringify(updatedTokens)),
      status: "connected",
      statusMessage: `Conectada con ${tokens.email || "Google"}`,
    },
  });

  return updatedTokens.access_token;
}
