import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { db } from "../db";
import { decrypt } from "../crypto";

/**
 * Cliente de WhatsApp Cloud API (Meta Graph). Única salida hacia Meta:
 * lo usan el webhook (web), el worker, el scheduler y el envío desde el panel.
 * Sin sockets ni sesión en disco: cada envío es un POST HTTP, así que funciona
 * igual desde Next.js que desde el worker.
 */

const GRAPH_BASE = process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com";
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v25.0";

/** Ventana de servicio de WhatsApp: texto libre solo 24 h después del último mensaje del cliente. */
export const WINDOW_MS = 24 * 60 * 60 * 1000;

export class MetaApiError extends Error {
  constructor(message: string, public status: number, public code: number | null = null) {
    super(message);
    this.name = "MetaApiError";
  }
  /** Token vencido o revocado. Meta marca como OAuthException también errores 5xx transitorios. */
  get isAuthError() {
    return this.status < 500 && (this.status === 401 || this.code === 190);
  }
}

export async function graphRequest<T = any>(
  path: string,
  opts: { token: string; method?: "GET" | "POST"; body?: unknown }
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${GRAPH_BASE}/${GRAPH_VERSION}/${path}`, {
      method: opts.method ?? "GET",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new MetaApiError("No se pudo contactar la API de Meta", 0);
  }
  const json: any = await res.json().catch(() => null);
  if (!res.ok) {
    throw new MetaApiError(json?.error?.message ?? `Meta respondió ${res.status}`, res.status, json?.error?.code ?? null);
  }
  return json as T;
}

/** Mensaje legible para el panel a partir de un error de Meta. */
export function metaErrorMessage(err: unknown): string {
  if (!(err instanceof MetaApiError)) return err instanceof Error ? err.message : String(err);
  if (err.isAuthError) return "El token de WhatsApp no es válido o expiró. Reconecta el número en Canales.";
  if (err.status === 0 || err.status >= 500) return "Meta no está disponible en este momento; intenta de nuevo.";
  if (err.code === 131047) return "Pasaron más de 24 h desde el último mensaje del cliente: solo se puede escribir con una plantilla aprobada.";
  if (err.code === 131030) return "El número no está en la lista de destinatarios de prueba de tu app de Meta.";
  return err.message;
}

/* ---------------- Credenciales (single-tenant, en ChannelState "whatsapp") ---------------- */

export interface WhatsAppConfig {
  wabaId: string;
  phoneNumberId: string;
  /** Plantilla aprobada para recordatorios fuera de la ventana de 24 h (opcional). */
  reminderTemplate?: string;
  reminderTemplateLang?: string;
}

export interface WhatsAppCreds extends WhatsAppConfig {
  token: string;
}

export async function getWhatsAppCreds(): Promise<WhatsAppCreds | null> {
  const state = await db.channelState.findUnique({ where: { id: "whatsapp" } });
  const cfg = state?.config as WhatsAppConfig | null;
  if (!state?.encryptedCredentials || !cfg?.phoneNumberId) return null;
  const token = decrypt(state.encryptedCredentials);
  return token ? { ...cfg, token } : null;
}

/* ---------------- Envío ---------------- */

/** Meta reporta wa_id en dígitos; acepta "+57 300…" y lo limpia. */
export const toWaId = (phone: string) => phone.replace(/\D/g, "");

/** Envía texto libre. Devuelve el wamid del mensaje saliente. */
export async function sendWhatsAppText(to: string, text: string, creds?: WhatsAppCreds | null): Promise<string | null> {
  const c = creds ?? (await getWhatsAppCreds());
  if (!c) throw new Error("WhatsApp no está conectado.");
  const res = await graphRequest<{ messages?: { id: string }[] }>(`${c.phoneNumberId}/messages`, {
    method: "POST",
    token: c.token,
    body: { messaging_product: "whatsapp", recipient_type: "individual", to: toWaId(to), type: "text", text: { preview_url: true, body: text } },
  });
  return res.messages?.[0]?.id ?? null;
}

/** Envía una plantilla aprobada con variables de cuerpo {{1}}, {{2}}… */
export async function sendWhatsAppTemplate(
  to: string,
  name: string,
  lang: string,
  params: string[],
  creds?: WhatsAppCreds | null
): Promise<string | null> {
  const c = creds ?? (await getWhatsAppCreds());
  if (!c) throw new Error("WhatsApp no está conectado.");
  const res = await graphRequest<{ messages?: { id: string }[] }>(`${c.phoneNumberId}/messages`, {
    method: "POST",
    token: c.token,
    body: {
      messaging_product: "whatsapp",
      to: toWaId(to),
      type: "template",
      template: {
        name,
        language: { code: lang },
        ...(params.length ? { components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] } : {}),
      },
    },
  });
  return res.messages?.[0]?.id ?? null;
}

/** Marca como leído y muestra "escribiendo…" (dura hasta ~25 s o hasta la respuesta). Best-effort. */
export async function markReadAndTyping(wamid: string, creds?: WhatsAppCreds | null): Promise<void> {
  try {
    const c = creds ?? (await getWhatsAppCreds());
    if (!c) return;
    await graphRequest(`${c.phoneNumberId}/messages`, {
      method: "POST",
      token: c.token,
      body: { messaging_product: "whatsapp", status: "read", message_id: wamid, typing_indicator: { type: "text" } },
    });
  } catch {}
}

export function isWindowOpen(lastInboundAt: Date | null | undefined, now = new Date()): boolean {
  if (!lastInboundAt) return false;
  const elapsed = now.getTime() - lastInboundAt.getTime();
  return elapsed >= 0 && elapsed < WINDOW_MS;
}

/* ---------------- Conexión y webhook ---------------- */

/** Valida token↔número contra Graph sin guardar nada. */
export async function testConnection(phoneNumberId: string, token: string) {
  const res = await graphRequest<{ display_phone_number?: string; verified_name?: string }>(
    `${phoneNumberId}?fields=display_phone_number,verified_name`,
    { token }
  );
  if (!res.display_phone_number) throw new MetaApiError("Meta no devolvió el número: revisa el Phone Number ID.", 422);
  return { displayPhoneNumber: res.display_phone_number, verifiedName: res.verified_name ?? null };
}

/**
 * Token secreto del webhook. Hace de segmento de la ruta (capa 1) y de verify token
 * en el handshake de Meta. Si no se define META_WEBHOOK_VERIFY_TOKEN se deriva de
 * SESSION_SECRET para que funcione sin configuración extra.
 */
export function webhookVerifyToken(): string {
  if (process.env.META_WEBHOOK_VERIFY_TOKEN) return process.env.META_WEBHOOK_VERIFY_TOKEN;
  const seed = process.env.SESSION_SECRET || "sintia_default_secret_key_change_in_production_32b!";
  return createHash("sha256").update(`${seed}:wa-webhook`).digest("hex").slice(0, 32);
}

export function webhookUrl(): string {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/webhooks/whatsapp/${webhookVerifyToken()}`;
}

/**
 * Registra el webhook de Sintia en el número (override a nivel número, como Vocero),
 * para no tener que pegar la URL a mano en el panel de Meta.
 * 1) suscribe la app a la WABA, 2) override_callback_uri en el número (Meta hace el handshake).
 * Nunca lanza: si falla, la conexión queda guardada y la UI muestra la URL para pegarla a mano.
 */
export async function registerWebhook(c: WhatsAppCreds): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await graphRequest(`${c.wabaId}/subscribed_apps`, { method: "POST", token: c.token });
    await graphRequest(c.phoneNumberId, {
      method: "POST",
      token: c.token,
      body: { webhook_configuration: { override_callback_uri: webhookUrl(), verify_token: webhookVerifyToken() } },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, message: metaErrorMessage(err) };
  }
}

/** Quita el override del número al desconectar, solo si apunta a esta instancia. Best-effort. */
export async function unregisterWebhook(c: WhatsAppCreds): Promise<void> {
  try {
    const res = await graphRequest<{ webhook_configuration?: { phone_number?: string } }>(
      `${c.phoneNumberId}?fields=webhook_configuration`,
      { token: c.token }
    );
    const current = res.webhook_configuration?.phone_number;
    if (!current || !current.includes(`/api/webhooks/whatsapp/${webhookVerifyToken()}`)) return;
    await graphRequest(c.phoneNumberId, {
      method: "POST",
      token: c.token,
      body: { webhook_configuration: { override_callback_uri: "" } },
    });
  } catch {}
}

/* ---------------- Seguridad del webhook ---------------- */

export function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Firma x-hub-signature-256 sobre el body crudo. Si no hay META_APP_SECRET la capa queda desactivada. */
export function isValidSignature(rawBody: string, header: string | null, appSecret = process.env.META_APP_SECRET): boolean {
  if (!appSecret) return true;
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  return safeEqual(header.slice(7), expected);
}

/* ---------------- Parseo del payload ---------------- */

export interface InboundMessage {
  id: string; // wamid
  waId: string;
  name: string | null;
  type: string;
  text: string;
}

export interface FailedStatus {
  id: string;
  recipient: string;
  error: string;
}

/** Extrae mensajes entrantes y estados fallidos del payload de webhook de Meta. */
export function parseWebhook(payload: any): { messages: InboundMessage[]; failed: FailedStatus[] } {
  const messages: InboundMessage[] = [];
  const failed: FailedStatus[] = [];
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      if (change?.field !== "messages") continue;
      const v = change.value ?? {};
      const names = new Map<string, string>();
      for (const c of v.contacts ?? []) if (c?.wa_id && c?.profile?.name) names.set(c.wa_id, c.profile.name);

      for (const m of v.messages ?? []) {
        if (!m?.id || !m?.from) continue;
        const text =
          m.text?.body ??
          m.button?.text ??
          m.interactive?.button_reply?.title ??
          m.interactive?.list_reply?.title ??
          m[m.type]?.caption ??
          "";
        messages.push({ id: m.id, waId: m.from, name: names.get(m.from) ?? null, type: m.type ?? "unknown", text });
      }
      for (const s of v.statuses ?? []) {
        if (s?.status !== "failed") continue;
        const e = s.errors?.[0];
        failed.push({ id: s.id, recipient: s.recipient_id ?? "", error: e ? `${e.code} ${e.title ?? e.message ?? ""}`.trim() : "desconocido" });
      }
    }
  }
  return { messages, failed };
}
