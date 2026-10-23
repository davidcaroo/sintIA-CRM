import { getValidAccessToken } from "./oauth";
import { db } from "../../db";

export interface SendEmailPayload {
  to: string;
  subject: string;
  bodyText: string;
}

/**
 * Codifica en base64url estándar RFC 4648 sin padding
 */
function toBase64Url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Envía un correo electrónico a través de la API REST de Gmail
 */
export async function sendGmailEmail(payload: SendEmailPayload): Promise<any> {
  const token = await getValidAccessToken("google_gmail");
  const business = await db.businessInfo.findFirst();
  const businessName = business?.name || "Clínica Dental Lumen";

  const emailLines = [
    `From: "${businessName}" <me>`,
    `To: ${payload.to}`,
    `Subject: =?utf-8?B?${Buffer.from(payload.subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    payload.bodyText,
  ];

  const rawMessage = emailLines.join("\r\n");
  const encodedRaw = toBase64Url(rawMessage);

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedRaw }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error enviando correo con Gmail: ${errorText}`);
  }

  return res.json();
}
