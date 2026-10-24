import { db } from "../db";
import { buildSystemPrompt } from "../prompt-builder";
import { getAvailableTools } from "./tools";
import { executeTool, ToolExecutionResult } from "./executor";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface AssistantResponse {
  reply: string;
  timeline: ToolExecutionResult[];
  toolsUsed: any[];
  modelUsed: string;
}

export async function runAssistantConversation(
  userMessage: string,
  history: { sender: string; text: string }[] = [],
  options: {
    isSafeMode?: boolean;
    customerName?: string;
    customerPhone?: string;
    channel?: string;
    conversationId?: string;
  } = {}
): Promise<AssistantResponse> {
  const isSafe = options.isSafeMode ?? true;
  const config = await db.assistantConfig.findFirst();
  const preferredModel = config?.model || process.env.DEFAULT_MODEL || "anthropic/claude-haiku-5.5";
  const fallbackModel = config?.fallbackModel || process.env.DEFAULT_MODEL || "anthropic/claude-haiku-5.5";
  const apiKey = process.env.OPENROUTER_API_KEY;

  // 1. Construir prompt del sistema y herramientas
  const systemPrompt = await buildSystemPrompt({
    customerName: options.customerName,
    customerPhone: options.customerPhone,
    isSafeMode: isSafe,
  });

  const availableTools = await getAvailableTools(isSafe);
  const timeline: ToolExecutionResult[] = [];
  const toolsUsedForMessage: any[] = [];

  // 2. Si no hay clave de OpenRouter, probar si hay GEMINI_API_KEY directa
  if (!apiKey || apiKey.trim() === "") {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "") {
      try {
        const geminiModel = preferredModel.includes("gemini")
          ? preferredModel.replace("google/", "")
          : "gemini-2.5-flash";
        const geminiReply = await callGeminiApi(systemPrompt, userMessage, history, geminiModel);
        return {
          reply: geminiReply,
          timeline: [],
          toolsUsed: [],
          modelUsed: `google/${geminiModel}`,
        };
      } catch (err: any) {
        console.warn(`⚠️ [Gemini Direct] ${err.message}. Empleando motor inteligente local.`);
      }
    }
    return simulateLocalAssistantResponse(userMessage, systemPrompt, isSafe, options);
  }

  // 3. Preparar historial para OpenRouter (últimos 20 mensajes)
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  const recentHistory = history.slice(-20);
  for (const h of recentHistory) {
    messages.push({
      role: h.sender === "assistant" ? "assistant" : "user",
      content: h.text,
    });
  }

  messages.push({ role: "user", content: userMessage });

  let activeModel = preferredModel;
  let attempts = 0;
  const MAX_TOOL_CALLS = 5;

  while (attempts < MAX_TOOL_CALLS) {
    attempts++;
    let responseData: any = null;

    try {
      responseData = await callOpenRouter(messages, availableTools, activeModel);
    } catch (err: any) {
      console.warn(`⚠️ Error en OpenRouter con modelo ${activeModel}: ${err.message}`);

      // Si falla y estábamos usando un modelo distinto del fallback, registrar en Actividad y reintentar con el default
      if (activeModel !== fallbackModel) {
        try {
          await db.activityLog.create({
            data: {
              action: "model_retry",
              channel: options.channel || "test",
              details: `El modelo ${activeModel} no respondió (${err.message}). Reintentando con modelo por defecto ${fallbackModel}.`,
              status: "warning",
              error: err.message,
            },
          });
        } catch {
          // Ignorar fallo de log
        }

        activeModel = fallbackModel;
        responseData = await callOpenRouter(messages, availableTools, fallbackModel);
      } else {
        // Fallback a motor local si OpenRouter está inaccesible
        return simulateLocalAssistantResponse(userMessage, systemPrompt, isSafe, options);
      }
    }

    const choice = responseData?.choices?.[0];
    const message = choice?.message;

    if (!message) {
      break;
    }

    // Comprobar si el modelo quiere llamar a herramientas
    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: message.content || null,
        tool_calls: message.tool_calls,
      });

      for (const tc of message.tool_calls) {
        const fnName = tc.function.name;
        let fnArgs: any = {};
        try {
          fnArgs = JSON.parse(tc.function.arguments || "{}");
        } catch {
          fnArgs = {};
        }

        // Ejecutar herramienta
        const execResult = await executeTool(fnName, fnArgs, {
          isSafeMode: isSafe,
          channel: options.channel,
          conversationId: options.conversationId,
        });

        timeline.push(execResult);
        toolsUsedForMessage.push({
          name: fnName,
          args: fnArgs,
          result: execResult.summary,
        });

        messages.push({
          role: "tool",
          name: fnName,
          tool_call_id: tc.id,
          content: JSON.stringify(execResult.result),
        });
      }

      // Continuar el bucle para que el modelo redacte su respuesta con los datos de las tools
      continue;
    }

    // Si no hay más tool_calls, hemos obtenido la respuesta final en texto
    return {
      reply: message.content || "Disculpa, ¿podrías repetirme tu consulta?",
      timeline,
      toolsUsed: toolsUsedForMessage,
      modelUsed: activeModel,
    };
  }

  // Respuesta de cierre si superó el límite de herramientas
  return {
    reply: "He recopilado los datos y gestionado tu solicitud con el equipo.",
    timeline,
    toolsUsed: toolsUsedForMessage,
    modelUsed: activeModel,
  };
}

async function callGeminiApi(
  systemPrompt: string,
  userMessage: string,
  history: { sender: string; text: string }[],
  model = "gemini-2.5-flash"
): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error("No GEMINI_API_KEY configurada.");

  const contents: any[] = [];
  const recentHistory = history.slice(-10);
  for (const h of recentHistory) {
    contents.push({
      role: h.sender === "assistant" ? "model" : "user",
      parts: [{ text: h.text }],
    });
  }
  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 600,
        },
      }),
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${errorBody.slice(0, 180)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Respuesta vacía recibida de Gemini.");
  return text;
}

async function callOpenRouter(messages: ChatMessage[], tools: any[], model: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": appUrl,
      "X-Title": "Sintia",
    },
    body: JSON.stringify({
      model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? "auto" : undefined,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`OpenRouter HTTP ${res.status}: ${errorBody.slice(0, 200)}`);
  }

  return res.json();
}

/**
 * Motor local heurístico que simula la IA y las llamadas a tools
 * para demostraciones cuando no se ha configurado aún una clave de pago.
 */
async function simulateLocalAssistantResponse(
  userMsg: string,
  systemPrompt: string,
  isSafe: boolean,
  options: any
): Promise<AssistantResponse> {
  const lower = userMsg.toLowerCase();
  const timeline: ToolExecutionResult[] = [];
  const toolsUsed: any[] = [];
  let reply = "";

  // Obtener nombre del negocio actual de la BD
  const business = await db.businessInfo.findFirst();
  const businessName = business?.name || "InnovaCode Solutions";

  // 1. Detectar si pregunta por precio, cotización o catálogo
  if (
    lower.includes("precio") ||
    lower.includes("cuanto cuesta") ||
    lower.includes("cuánto cuesta") ||
    lower.includes("cotiz") ||
    lower.includes("landing") ||
    lower.includes("pagina web") ||
    lower.includes("página web") ||
    lower.includes("tienda") ||
    lower.includes("ecommerce") ||
    lower.includes("software") ||
    lower.includes("ia") ||
    lower.includes("inteligencia artificial") ||
    lower.includes("automatiz")
  ) {
    let termino = "landing";
    if (lower.includes("tienda") || lower.includes("ecommerce")) termino = "tienda";
    else if (lower.includes("pagina") || lower.includes("página") || lower.includes("informativa")) termino = "informativa";
    else if (lower.includes("software") || lower.includes("medida")) termino = "medida";
    else if (lower.includes("ia") || lower.includes("inteligencia")) termino = "inteligencia";
    else if (lower.includes("automatiz") || lower.includes("proceso")) termino = "automatización";

    const tRes = await executeTool("consultar_servicios", { termino }, { isSafeMode: isSafe });
    timeline.push(tRes);
    toolsUsed.push({ name: "consultar_servicios", args: { termino }, result: tRes.summary });

    const serv = tRes.result?.[0];
    if (serv) {
      reply = `¡Con mucho gusto! En ${businessName}, el servicio de ${serv.nombre} tiene una inversión estimada de ${serv.precio} y requiere una sesión técnica de ${serv.duracion}. ${
        serv.requiereValoracionPrevia ? "Requiere una valoración técnica inicial para definir el alcance exacto. " : "Incluye hosting, dominio y SEO el primer año. "
      }¿Te gustaría que agendemos una consulta técnica gratuita de 30 minutos por Google Meet?`;
    } else {
      reply = `En ${businessName} desarrollamos Landing Pages ($800.000 COP), Páginas Web Informativas ($1.500.000 COP), Tiendas E-commerce ($2.600.000 COP) y Software a medida con IA. ¿Cuál de estas soluciones se adapta mejor a tu objetivo?`;
    }
  }
  // 2. Detectar si quiere pedir cita, reunión o consulta
  else if (
    lower.includes("cita") ||
    lower.includes("reunion") ||
    lower.includes("reunión") ||
    lower.includes("consulta") ||
    lower.includes("meet") ||
    lower.includes("hueco") ||
    lower.includes("hora") ||
    lower.includes("mañana") ||
    lower.includes("viernes") ||
    lower.includes("lunes")
  ) {
    const calRes = await executeTool("consultar_huecos_libres", { fecha: "2026-10-24" }, { isSafeMode: isSafe });
    timeline.push(calRes);
    toolsUsed.push({ name: "consultar_huecos_libres", args: { fecha: "2026-10-24" }, result: calRes.summary });

    // Si ya da su confirmación o selección de hora
    if (lower.includes("10:00") || lower.includes("12:30") || lower.includes("17:00") || lower.includes("quiero") || lower.includes("perfecto")) {
      const citaRes = await executeTool(
        "crear_cita",
        {
          servicio: "Consulta Técnica Gratuita de Diagnóstico",
          fechaHoraInicio: "2026-10-24T10:00:00-05:00",
          nombreCliente: options.customerName || "Cliente Potencial",
          telefonoCliente: options.customerPhone || "+57 311 606 1807",
        },
        { isSafeMode: isSafe }
      );
      timeline.push(citaRes);
      toolsUsed.push({ name: "crear_cita", args: citaRes.args, result: citaRes.summary });

      reply = `¡Excelente! He agendado tu Consulta Técnica Gratuita con el equipo de ${businessName} para mañana a las 10:00 AM (hora Colombia). Te enviaremos el enlace de Google Meet. ¿Hay algún detalle específico de tu proyecto que desees que preparemos de antemano?`;
    } else {
      reply = `He consultado la agenda del equipo técnico y tenemos los siguientes espacios disponibles para tu consulta gratuita por Google Meet:\n• 10:00 AM\n• 12:30 PM\n• 5:00 PM (hora Colombia)\n¿Cuál de estos horarios te queda mejor?`;
    }
  }
  // 3. Detectar soporte crítico, requerimiento complejo o queja
  else if (
    lower.includes("urgente") ||
    lower.includes("hablar con una persona") ||
    lower.includes("humano") ||
    lower.includes("asesor") ||
    lower.includes("cto") ||
    lower.includes("ingeniero") ||
    lower.includes("queja") ||
    lower.includes("problema")
  ) {
    const hRes = await executeTool(
      "pasar_a_humano",
      { motivo: "Cliente solicita hablar directamente con el equipo de ingeniería de InnovaCode" },
      { isSafeMode: isSafe }
    );
    timeline.push(hRes);
    toolsUsed.push({ name: "pasar_a_humano", args: hRes.args, result: hRes.summary });

    reply = `Comprendo perfectamente. He transferido de inmediato esta conversación a un ingeniero de nuestro equipo en InnovaCode Solutions para que te contacte de forma directa. También puedes escribirnos o llamarnos al +57 311 606 1807 o al correo contacto@innovacode.click.`;
  }
  // 4. Saludo o respuesta general
  else {
    reply = `¡Hola! Soy Sintia, asistente virtual de ${businessName}. 🚀 Creamos software a medida, aplicaciones web, tiendas online y agentes de Inteligencia Artificial para tu empresa. ¿Deseas cotizar un proyecto o agendar una asesoría técnica gratuita?`;
  }

  return {
    reply,
    timeline,
    toolsUsed,
    modelUsed: "local/innovacode-assistant",
  };
}
