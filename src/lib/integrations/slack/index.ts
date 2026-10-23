import { db } from "../../db";
import { decrypt } from "../../crypto";

export async function sendSlackNotification(text: string, options: { urgent?: boolean } = {}): Promise<any> {
  const integration = await db.integration.findUnique({ where: { id: "slack" } });
  if (!integration || !integration.isConnected) {
    return { skipped: true, reason: "Slack no conectado" };
  }

  const webhookUrl = integration.encryptedCredentials
    ? decrypt(integration.encryptedCredentials)
    : process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("No hay URL de Incoming Webhook configurada para Slack.");
  }

  const payload = {
    text: `${options.urgent ? "🚨 *[URGENTE]* " : "🔔 "}${text}`,
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook error: ${await res.text()}`);
  }

  return { success: true };
}
