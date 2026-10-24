import { NextRequest, NextResponse } from "next/server";
import { generateJson, hasLlm } from "@/lib/ai/llm";
import { extractContacts, fetchPage, htmlToText, pageTitle, rankInternalLinks, type ContactInfo } from "@/lib/knowledge/web-extract";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_PAGES = 9; // portada + 8 subpáginas
const PAGE_CHARS = 12000;
const TOTAL_CHARS = 80000;

interface AiService {
  name: string;
  description: string;
  price: number | null;
  isFromPrice: boolean;
  durationMinutes: number | null;
  requiresValuation: boolean;
  sourceUrl?: string;
}

interface AiResult {
  business?: { name?: string; activity?: string; address?: string; city?: string; hours?: string };
  services?: AiService[];
  faqs?: { question: string; answer: string; sourceUrl?: string }[];
  knowledge?: string;
}

const SYSTEM = `Eres un analista que extrae, con EXACTITUD, la información de la web de un negocio para configurar a su asistente de atención al cliente por WhatsApp.

Reglas obligatorias:
- Usa SOLO información que esté escrita en el texto recibido. Nunca inventes, completes ni supongas datos. Si algo no aparece, usa null o déjalo fuera.
- Copia nombres de servicios, precios, horarios y condiciones tal como aparecen (puedes corregir mayúsculas y espacios).
- Precios: número entero en la moneda local, sin símbolos ni separadores ("$1.500.000" → 1500000; "1,5 millones" → 1500000). Si dice "desde", "a partir de" o similar → isFromPrice true. Si el precio no aparece → price null.
- durationMinutes solo si la web indica la duración; si no, null.
- requiresValuation true solo si la web dice que requiere valoración, evaluación o cotización previa.
- Un servicio por cada servicio, producto o plan distinto que ofrezca el negocio. No dupliques.
- FAQs: incluye todas las preguntas frecuentes explícitas de la web. Además puedes redactar preguntas que haría un cliente (horarios, ubicación, formas de pago, envíos, garantía, reservas…) SOLO si la respuesta está literalmente respaldada por el texto. Respuestas breves, en segunda persona, tono cordial.
- knowledge: en Markdown, con secciones (## Sobre el negocio, ## Horarios, ## Formas de pago, ## Políticas, ## Cobertura y envíos, ## Promociones…) solo con lo que diga la web. Nada de relleno ni frases de marketing vacías.
- sourceUrl: la URL de la página de donde sale cada dato.

Responde ÚNICAMENTE con JSON válido con esta forma:
{
  "business": { "name": string|null, "activity": string|null, "address": string|null, "city": string|null, "hours": string|null },
  "services": [ { "name": string, "description": string, "price": number|null, "isFromPrice": boolean, "durationMinutes": number|null, "requiresValuation": boolean, "sourceUrl": string } ],
  "faqs": [ { "question": string, "answer": string, "sourceUrl": string } ],
  "knowledge": string
}`;

/** Todos los números que aparecen en el texto, sin separadores, para verificar precios. */
function numbersIn(text: string): Set<string> {
  const set = new Set<string>();
  for (const m of text.matchAll(/\d[\d.,\s]*\d|\d/g)) {
    const raw = m[0].replace(/\s/g, "");
    set.add(raw.replace(/[.,]/g, ""));
    // "1,5 millones" / "2.5 M"
    const after = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 10).toLowerCase();
    if (/^\s*(millones|millón|millon|m\b|mm\b)/.test(after)) {
      const n = parseFloat(raw.replace(",", "."));
      if (Number.isFinite(n)) set.add(String(Math.round(n * 1_000_000)));
    }
    if (/^\s*(mil\b|k\b)/.test(after)) {
      const n = parseFloat(raw.replace(",", "."));
      if (Number.isFinite(n)) set.add(String(Math.round(n * 1000)));
    }
  }
  return set;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let raw = String(body.url || "").trim();
    if (raw && !/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
    try {
      new URL(raw);
    } catch {
      return NextResponse.json({ error: "Introduce una URL válida, por ejemplo https://tunegocio.com" }, { status: 400 });
    }

    // 1. Portada
    let home;
    try {
      home = await fetchPage(raw);
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "No se pudo conectar con la web." }, { status: 400 });
    }
    if (!home) return NextResponse.json({ error: "La web no respondió con una página HTML." }, { status: 400 });

    // 2. Subpáginas priorizadas, en paralelo
    const subUrls = rankInternalLinks(home.html, home.url, MAX_PAGES - 1);
    const subPages = await Promise.all(subUrls.map((u) => fetchPage(u, 10000).catch(() => null)));
    const pages = [home, ...subPages.filter((p): p is { url: string; html: string } => !!p)];

    // 3. Contactos deterministas (sin IA: teléfonos, correos, WhatsApp, redes, JSON-LD)
    let contacts: ContactInfo | undefined;
    for (const p of pages) contacts = extractContacts(p.html, p.url, contacts);
    contacts = contacts!;

    const pageTexts = pages.map((p) => ({ url: p.url, title: pageTitle(p.html), text: htmlToText(p.html).slice(0, PAGE_CHARS) }));
    let corpus = "";
    for (const p of pageTexts) {
      if (corpus.length >= TOTAL_CHARS) break;
      corpus += `\n\n=== PÁGINA: ${p.title || "(sin título)"} — ${p.url} ===\n${p.text}`;
    }
    corpus = corpus.slice(0, TOTAL_CHARS);

    const warnings: string[] = [];
    let ai: AiResult = {};

    // 4. Extracción con IA (solo lo que está escrito)
    if (hasLlm()) {
      try {
        ai = await generateJson<AiResult>({
          system: SYSTEM,
          parts: [
            {
              text: `Web: ${home.url}\nDatos de contacto ya detectados automáticamente (no los repitas en FAQs salvo que aporten contexto):\n${JSON.stringify(contacts)}\n\nTexto de las páginas:${corpus}`,
            },
          ],
          maxTokens: 8192,
          timeoutMs: 90000,
        });
      } catch (err: any) {
        console.warn("[Web-Importer] Fallo de la IA:", err.message);
        warnings.push(`La IA no pudo analizar el contenido (${err.message}). Solo se muestran los datos de contacto detectados.`);
      }
    } else {
      warnings.push("No hay clave de IA configurada: solo se detectaron los datos de contacto. Configura GEMINI_API_KEY u OPENROUTER_API_KEY para extraer servicios y preguntas frecuentes.");
    }

    // 5. Validación y verificación contra el texto original
    const sourceNumbers = numbersIn(corpus);
    const seen = new Set<string>();
    const services = (Array.isArray(ai.services) ? ai.services : [])
      .filter((s) => s && typeof s.name === "string" && s.name.trim())
      .filter((s) => {
        const k = s.name.trim().toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map((s) => {
        const price = typeof s.price === "number" && s.price >= 0 ? Math.round(s.price) : null;
        const duration =
          typeof s.durationMinutes === "number" && s.durationMinutes >= 5 && s.durationMinutes <= 720 ? Math.round(s.durationMinutes) : null;
        return {
          name: s.name.trim(),
          description: (s.description || "").trim(),
          price,
          isFromPrice: !!s.isFromPrice,
          durationMinutes: duration,
          requiresValuation: !!s.requiresValuation,
          sourceUrl: s.sourceUrl || null,
          // El precio no aparece en el texto descargado: se marca para revisión manual
          priceUnverified: price !== null && price > 0 && !sourceNumbers.has(String(price)),
        };
      });
    if (services.some((s) => s.priceUnverified)) {
      warnings.push("Algunos precios no se encontraron literalmente en la web: revísalos antes de guardar (marcados en ámbar).");
    }

    const faqs = (Array.isArray(ai.faqs) ? ai.faqs : [])
      .filter((f) => f && f.question?.trim() && f.answer?.trim())
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim(), sourceUrl: f.sourceUrl || null }));

    const name = ai.business?.name || contacts.names[0] || pageTitle(home.html).split(/[|\-–—]/)[0].trim() || "";
    const address = ai.business?.address || contacts.addresses[0] || "";
    const hours = ai.business?.hours || contacts.hours.join("; ") || "";

    return NextResponse.json({
      success: true,
      scrapedPagesCount: pages.length,
      pages: pageTexts.map((p) => ({ url: p.url, title: p.title })),
      warnings,
      proposal: {
        business: {
          name,
          activity: ai.business?.activity || contacts.description || "",
          address: [address, ai.business?.city && !address.includes(ai.business.city) ? ai.business.city : ""].filter(Boolean).join(", "),
          phone: contacts.phones[0] || contacts.whatsapp[0] || "",
          website: new URL(home.url).origin,
        },
        contact: {
          phones: contacts.phones,
          whatsapp: contacts.whatsapp,
          emails: contacts.emails,
          socials: contacts.socials,
          hours,
        },
        services,
        faqs,
        knowledge: typeof ai.knowledge === "string" ? ai.knowledge.trim() : "",
      },
    });
  } catch (error: any) {
    console.error("Error en importador web:", error);
    return NextResponse.json({ error: error.message || "Error al procesar la web." }, { status: 500 });
  }
}
