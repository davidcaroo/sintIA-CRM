/**
 * Llamada única a un LLM multimodal (texto, imagen, audio, PDF, video).
 * Usa Gemini directo si hay GEMINI_API_KEY (lee audio/PDF de forma nativa);
 * si no, OpenRouter con un modelo multimodal de Gemini.
 * La clave nunca sale del servidor.
 */

/** Error del proveedor de IA con un mensaje entendible para el panel. */
export class LlmError extends Error {
  constructor(public status: number, provider: string, detail: string) {
    super(
      status === 402
        ? `La cuenta de ${provider} se quedó sin saldo o créditos (402). Recárgala para que la IA vuelva a funcionar.`
        : status === 401 || status === 403
        ? `La clave de ${provider} no es válida o no tiene permiso (${status}).`
        : status === 429
        ? `${provider} está limitando las peticiones (429). Inténtalo en unos minutos.`
        : `${provider} respondió ${status}: ${detail.slice(0, 160)}`
    );
    this.name = "LlmError";
  }
}

export type LlmPart = { text: string } | { data: Buffer; mime: string };

export function hasLlm(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim() || process.env.OPENROUTER_API_KEY?.trim());
}

export async function generate(opts: {
  system: string;
  parts: LlmPart[];
  json?: boolean;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) return callGemini(geminiKey, opts);
  const orKey = process.env.OPENROUTER_API_KEY?.trim();
  if (orKey) return callOpenRouter(orKey, opts);
  throw new Error("No hay clave de IA configurada (GEMINI_API_KEY u OPENROUTER_API_KEY).");
}

/** Igual que generate() pero devuelve el JSON ya parseado (tolera ```json …```). */
export async function generateJson<T = any>(opts: Omit<Parameters<typeof generate>[0], "json">): Promise<T> {
  const raw = await generate({ ...opts, json: true });
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned) as T;
}

async function callGemini(key: string, opts: Parameters<typeof generate>[0]): Promise<string> {
  const model = process.env.GEMINI_MEDIA_MODEL || "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [
        {
          role: "user",
          parts: opts.parts.map((p) =>
            "text" in p ? { text: p.text } : { inline_data: { mime_type: p.mime, data: p.data.toString("base64") } }
          ),
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: opts.maxTokens ?? 4096,
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 60000),
  });
  if (!res.ok) throw new LlmError(res.status, "Gemini", await res.text());
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("");
  if (!text) throw new Error("Gemini devolvió una respuesta vacía.");
  return text;
}

async function callOpenRouter(key: string, opts: Parameters<typeof generate>[0]): Promise<string> {
  const content = opts.parts.map((p) => {
    if ("text" in p) return { type: "text", text: p.text };
    const dataUrl = `data:${p.mime};base64,${p.data.toString("base64")}`;
    if (p.mime.startsWith("image/")) return { type: "image_url", image_url: { url: dataUrl } };
    if (p.mime.startsWith("audio/")) {
      const format = p.mime.split("/")[1].split(";")[0].replace("mpeg", "mp3");
      return { type: "input_audio", input_audio: { data: p.data.toString("base64"), format } };
    }
    return { type: "file", file: { filename: "archivo", file_data: dataUrl } };
  });
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Sintia",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MEDIA_MODEL || "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content },
      ],
      temperature: 0.1,
      max_tokens: opts.maxTokens ?? 4096,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 60000),
  });
  if (!res.ok) throw new LlmError(res.status, "OpenRouter", await res.text());
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter devolvió una respuesta vacía.");
  return text;
}
