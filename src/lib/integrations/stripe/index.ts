import { db } from "../../db";
import { decrypt } from "../../crypto";

/**
 * Valida la clave de Stripe y detecta si es modo test
 */
export async function validateStripeKey(apiKey: string): Promise<{ valid: boolean; isTestMode: boolean; error?: string }> {
  try {
    const isTestMode = apiKey.startsWith("rk_test_") || apiKey.startsWith("sk_test_");

    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      return { valid: false, isTestMode, error: err.error?.message || "Clave inválida" };
    }

    return { valid: true, isTestMode };
  } catch (error: any) {
    return { valid: false, isTestMode: false, error: error.message };
  }
}

/**
 * Crea un Checkout Session o Payment Link para la señal de una cita
 */
export async function createStripeDepositLink(serviceName: string, amountEuros: number): Promise<{ url: string; id: string }> {
  const integration = await db.integration.findUnique({ where: { id: "stripe" } });
  if (!integration || !integration.isConnected || !integration.encryptedCredentials) {
    throw new Error("Stripe no está conectado.");
  }

  const apiKey = decrypt(integration.encryptedCredentials);
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  // Crear Checkout Session vía API de Stripe
  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", `${appUrl}/demo?deposit_paid=true`);
  params.append("cancel_url", `${appUrl}/demo?deposit_cancelled=true`);
  params.append("line_items[0][price_data][currency]", "eur");
  params.append("line_items[0][price_data][unit_amount]", Math.round(amountEuros * 100).toString());
  params.append("line_items[0][price_data][product_data][name]", `Señal de reserva: ${serviceName}`);
  params.append("line_items[0][quantity]", "1");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Error en Stripe Checkout: ${err.error?.message || "Fallo en API"}`);
  }

  const session = await res.json();
  return { url: session.url, id: session.id };
}
