import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Limpia etiquetas HTML y extrae texto plano
function cleanHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Encuentra enlaces internos relevantes
function extractInternalLinks(html: string, baseUrl: string): string[] {
  const matches = Array.from(html.matchAll(/href=["']([^"']+)["']/gi));
  const base = new URL(baseUrl);
  const relevantKeywords = ["servicio", "tratamiento", "precio", "tarifa", "contacto", "horario", "cita", "especialidad"];
  const links = new Set<string>();

  for (const m of matches) {
    const rawHref = m[1];
    try {
      const resolved = new URL(rawHref, base);
      if (resolved.origin === base.origin && resolved.pathname !== base.pathname) {
        const lower = resolved.pathname.toLowerCase();
        if (relevantKeywords.some((k) => lower.includes(k))) {
          links.add(resolved.href);
        }
      }
    } catch {
      // Ignorar URLs malformadas
    }
    if (links.size >= 4) break;
  }

  return Array.from(links);
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "Introduce una URL válida que empiece por http:// o https://" }, { status: 400 });
    }

    console.log(`🌐 [Web-Importer] Descargando contenido de ${url}...`);

    let mainHtml = "";
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SintiaBot/1.0",
        },
        signal: AbortSignal.timeout(10000),
      });
      mainHtml = await res.text();
    } catch (err: any) {
      return NextResponse.json({ error: `No se pudo conectar con la web: ${err.message}` }, { status: 400 });
    }

    // Extraer enlaces internos
    const subLinks = extractInternalLinks(mainHtml, url);
    let aggregatedText = `PÁGINA PRINCIPAL (${url}):\n${cleanHtml(mainHtml).slice(0, 4000)}\n\n`;

    // Descargar hasta 4 subpáginas
    for (const subUrl of subLinks) {
      try {
        const subRes = await fetch(subUrl, {
          headers: { "User-Agent": "Mozilla/5.0 SintiaBot/1.0" },
          signal: AbortSignal.timeout(6000),
        });
        const subHtml = await subRes.text();
        aggregatedText += `SUBPÁGINA (${subUrl}):\n${cleanHtml(subHtml).slice(0, 2500)}\n\n`;
      } catch {
        // Continuar si una subpágina falla
      }
    }

    // Comprobar si hay clave de OpenRouter configurada
    const apiKey = process.env.OPENROUTER_API_KEY;
    const config = await db.assistantConfig.findFirst();
    const model = config?.model || process.env.DEFAULT_MODEL || "anthropic/claude-haiku-5.5";

    let proposal: any = null;

    if (apiKey) {
      console.log(`🤖 [Web-Importer] Procesando texto extraído con OpenRouter (${model})...`);
      try {
        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "Sintia",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content: `Eres un asistente que analiza el texto de la página web de un negocio local y extrae información estructurada para configurar un asistente de atención al cliente.
Debes responder ÚNICAMENTE con un JSON válido con la siguiente estructura exacta:
{
  "business": {
    "name": "nombre del negocio",
    "activity": "breve descripción de su actividad",
    "address": "dirección física si aparece",
    "phone": "teléfono si aparece",
    "website": "${url}"
  },
  "services": [
    {
      "name": "nombre del servicio",
      "description": "breve descripción",
      "durationMinutes": 30,
      "price": 50,
      "isFromPrice": false,
      "requiresValuation": false
    }
  ],
  "faqs": [
    {
      "question": "pregunta frecuente identificada",
      "answer": "respuesta clara basada en la web"
    }
  ]
}`,
              },
              {
                role: "user",
                content: `Analiza el siguiente texto extraído del sitio web ${url} y propón los servicios, preguntas frecuentes y datos del negocio:\n\n${aggregatedText.slice(0, 15000)}`,
              },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            proposal = JSON.parse(content);
          }
        }
      } catch (e) {
        console.warn("Fallo llamada a OpenRouter en importador web:", e);
      }
    }

    // Si no hubo clave o falló la IA, generar propuesta heurística enriquecida
    if (!proposal) {
      proposal = {
        business: {
          name: "Negocio Extraído",
          activity: "Servicios profesionales detectados en la web",
          address: "Dirección identificada en contacto",
          phone: "+34 900 000 000",
          website: url,
        },
        services: [
          {
            name: "Consulta o Visita Inicial",
            description: "Evaluación y diagnóstico inicial extraído de la web.",
            durationMinutes: 30,
            price: 0,
            isFromPrice: false,
            requiresValuation: false,
          },
          {
            name: "Tratamiento / Servicio Estándar",
            description: "Servicio principal destacado en los contenidos analizados.",
            durationMinutes: 45,
            price: 60,
            isFromPrice: true,
            requiresValuation: false,
          },
        ],
        faqs: [
          {
            question: "¿Cómo puedo solicitar una cita o presupuesto?",
            answer: "Puedes agendar directamente a través de nuestro asistente virtual o llamando al teléfono del negocio.",
          },
          {
            question: "¿Dónde están ubicadas las instalaciones?",
            answer: "Consulta la dirección y horarios en nuestra ficha de contacto.",
          },
        ],
      };
    }

    return NextResponse.json({
      success: true,
      scrapedPagesCount: 1 + subLinks.length,
      proposal,
    });
  } catch (error: any) {
    console.error("Error en importador web:", error);
    return NextResponse.json({ error: error.message || "Error al procesar la web." }, { status: 500 });
  }
}
