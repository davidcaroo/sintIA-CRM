import { generate, hasLlm } from "../ai/llm";
import { downloadMedia, type WhatsAppCreds } from "./cloud";

/**
 * Convierte un adjunto entrante en texto: transcribe notas de voz, describe
 * imágenes (y lee su texto), resume PDFs y describe videos.
 * - display: lo que se muestra en la bandeja.
 * - forAi: lo que recibe el asistente como parte del mensaje del cliente.
 */

export interface InboundRow {
  id: string;
  type: string;
  text: string;
  mediaId: string | null;
  mime: string | null;
  filename: string | null;
}

const LABEL: Record<string, string> = {
  audio: "nota de voz",
  image: "imagen",
  video: "video",
  document: "documento",
  sticker: "sticker",
};

const PROMPTS: Record<string, string> = {
  audio:
    "Transcribe literalmente esta nota de voz de un cliente, en su idioma original, con puntuación. Devuelve SOLO la transcripción. Si no se entiende nada, responde exactamente: [inaudible]",
  image:
    "Un cliente envió esta imagen por WhatsApp a un negocio. En español y en máximo 3 frases: describe lo relevante para atenderlo (producto, problema, comprobante, documento, lugar…) y transcribe cualquier texto, cifra o referencia visible. Sin introducciones.",
  document:
    "Un cliente envió este documento por WhatsApp a un negocio. En español: resume en máximo 5 viñetas lo que contiene y extrae datos clave (nombres, fechas, montos, referencias, números de pedido). Sin introducciones.",
  video:
    "Un cliente envió este video por WhatsApp a un negocio. En español y en máximo 3 frases: describe lo que se ve que sea relevante y transcribe lo que se dice. Sin introducciones.",
};

const SYSTEM = "Eres un asistente que convierte adjuntos de clientes en texto fiel. Nunca inventes contenido que no esté en el archivo.";

function supported(type: string, mime: string): boolean {
  if (type === "document") return mime === "application/pdf" || mime.startsWith("image/") || mime.startsWith("text/");
  if (type === "video") return Boolean(process.env.GEMINI_API_KEY?.trim()); // OpenRouter no admite video de forma general
  return type === "audio" || type === "image";
}

export async function describeInbound(row: InboundRow, creds: WhatsAppCreds | null): Promise<{ display: string; forAi: string }> {
  const caption = row.text.trim();
  if (!row.mediaId) return { display: caption, forAi: caption };

  const label = LABEL[row.type] ?? "archivo";
  const name = row.filename ? ` «${row.filename}»` : "";
  if (row.type === "sticker") return { display: "[Sticker]", forAi: "" };

  const failed = (why: string) => ({
    display: `📎 ${label[0].toUpperCase() + label.slice(1)}${name}${caption ? `: ${caption}` : ""}`,
    forAi: `[El cliente envió ${row.type === "image" || row.type === "audio" ? "una" : "un"} ${label}${name} que ${why}.${caption ? ` Texto que lo acompaña: "${caption}"` : ""} Si lo necesitas para atenderlo, pídele amablemente que lo describa por escrito.]`,
  });

  const mime = (row.mime || "").split(";")[0].trim();
  if (!creds || !hasLlm()) return failed("no se pudo procesar (sin IA configurada)");
  if (!supported(row.type, mime)) return failed("no se puede leer automáticamente");

  try {
    const file = await downloadMedia(row.mediaId, creds);
    const result = (
      await generate({
        system: SYSTEM,
        parts: [{ data: file.data, mime: file.mime.split(";")[0] }, { text: PROMPTS[row.type] ?? PROMPTS.document }],
        maxTokens: 1500,
        timeoutMs: 90000,
      })
    ).trim();

    if (row.type === "audio") {
      return {
        display: `🎤 Nota de voz: «${result}»`,
        forAi: result === "[inaudible]" ? "[El cliente envió una nota de voz que no se entiende. Pídele que la repita o la escriba.]" : `[Nota de voz del cliente, transcrita]: ${result}`,
      };
    }
    const icon = row.type === "image" ? "🖼️" : row.type === "video" ? "🎬" : "📄";
    const title = `${icon} ${label[0].toUpperCase() + label.slice(1)}${name}`;
    return {
      display: `${title}${caption ? `: ${caption}` : ""}\n${result}`,
      forAi: `[${label[0].toUpperCase() + label.slice(1)}${name} ${row.type === "image" ? "enviada" : "enviado"} por el cliente. Contenido: ${result}]${caption ? `\nTexto que la acompaña: ${caption}` : ""}`,
    };
  } catch (err: any) {
    console.warn(`[media-ai] No se pudo procesar ${row.type} ${row.mediaId}: ${err.message}`);
    return failed("no se pudo descargar o analizar");
  }
}
