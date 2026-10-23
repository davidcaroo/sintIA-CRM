import crypto from "crypto";
import { db } from "../../db";
import { decrypt } from "../../crypto";

export async function dispatchWebhookEvent(event: string, payload: any): Promise<any> {
  const integration = await db.integration.findUnique({ where: { id: "webhooks" } });
  if (!integration || !integration.isConnected) {
    return { skipped: true, reason: "Webhooks no conectados" };
  }

  const config = (integration.config as any) || {};
  const destinationUrl = config.destinationUrl;
  const enabledEvents: string[] = config.enabledEvents || [];

  if (!destinationUrl) {
    throw new Error("No hay URL de destino configurada para los Webhooks.");
  }

  // Filtrar si el evento no está seleccionado
  if (enabledEvents.length > 0 && !enabledEvents.includes(event)) {
    return { skipped: true, reason: `Evento ${event} no activado` };
  }

  const secret = integration.encryptedCredentials
    ? decrypt(integration.encryptedCredentials)
    : "sintia_webhook_secret";

  const bodyData = {
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  };

  const bodyString = JSON.stringify(bodyData);
  const signature = crypto.createHmac("sha256", secret).update(bodyString).digest("hex");

  const res = await fetch(destinationUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sintia-Signature": `sha256=${signature}`,
      "X-Sintia-Event": event,
      "User-Agent": "Sintia-Webhooks/1.0",
    },
    body: bodyString,
    signal: AbortSignal.timeout(8000),
  });

  return { status: res.status, ok: res.ok };
}
