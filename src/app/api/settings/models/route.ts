import { NextRequest, NextResponse } from "next/server";

// Caché en memoria para la lista de modelos de OpenRouter (1 hora)
let cachedModels: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hora

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const now = Date.now();
    if (!forceRefresh && cachedModels && now - lastFetchTime < CACHE_DURATION_MS) {
      return NextResponse.json({
        cached: true,
        cachedAt: new Date(lastFetchTime).toISOString(),
        models: cachedModels,
      });
    }

    console.log("🌐 [OpenRouter] Consultando catálogo de modelos...");

    const apiKey = process.env.OPENROUTER_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers,
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter devolvió código HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawList = data.data || [];

    // Filtrar estrictamente solo modelos con soporte de herramientas ("tools")
    const filtered = rawList
      .filter((m: any) => {
        const supported = m.supported_parameters || [];
        return supported.includes("tools");
      })
      .map((m: any) => {
        // Extraer proveedor a partir del ID (ej: "anthropic/claude-3-haiku" -> "anthropic")
        const parts = (m.id || "").split("/");
        const provider = parts.length > 1 ? parts[0] : "desconocido";

        // Precio por millón de tokens (la API lo da por token individual)
        const promptPricePerToken = parseFloat(m.pricing?.prompt || "0");
        const completionPricePerToken = parseFloat(m.pricing?.completion || "0");

        const promptPricePerMillion = promptPricePerToken * 1000000;
        const completionPricePerMillion = completionPricePerToken * 1000000;

        return {
          id: m.id,
          name: m.name || m.id,
          provider,
          description: m.description,
          contextLength: m.context_length || 0,
          promptPricePerMillion: parseFloat(promptPricePerMillion.toFixed(2)),
          completionPricePerMillion: parseFloat(completionPricePerMillion.toFixed(2)),
          isFree: promptPricePerMillion === 0 && completionPricePerMillion === 0,
        };
      });

    cachedModels = filtered;
    lastFetchTime = now;

    return NextResponse.json({
      cached: false,
      cachedAt: new Date(now).toISOString(),
      models: filtered,
    });
  } catch (error: any) {
    console.warn("Error al cargar modelos de OpenRouter:", error.message);
    // Si falla o no hay conexión, devolver modelos recomendados por defecto
    const fallbackList = [
      {
        id: "anthropic/claude-haiku-5.5",
        name: "Claude 3.5 Haiku",
        provider: "anthropic",
        contextLength: 200000,
        promptPricePerMillion: 0.8,
        completionPricePerMillion: 4.0,
        isFree: false,
      },
      {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Gemini 2.0 Flash (Free)",
        provider: "google",
        contextLength: 1048576,
        promptPricePerMillion: 0,
        completionPricePerMillion: 0,
        isFree: true,
      },
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "openai",
        contextLength: 128000,
        promptPricePerMillion: 0.15,
        completionPricePerMillion: 0.6,
        isFree: false,
      },
      {
        id: "google/gemini-flash-1.5",
        name: "Gemini 1.5 Flash",
        provider: "google",
        contextLength: 1000000,
        promptPricePerMillion: 0.075,
        completionPricePerMillion: 0.3,
        isFree: false,
      },
    ];

    return NextResponse.json({
      cached: false,
      error: error.message,
      models: cachedModels || fallbackList,
    });
  }
}
