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

  // 2. Si no hay clave de OpenRouter configurada, usar el motor de demostración local con tool-calling realista
  if (!apiKey || apiKey.trim() === "") {
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

  // 1. Detectar si pregunta por precio o catálogo
  if (
    lower.includes("precio") ||
    lower.includes("cuanto cuesta") ||
    lower.includes("cuánto cuesta") ||
    lower.includes("blanqueamiento") ||
    lower.includes("limpieza") ||
    lower.includes("ortodoncia") ||
    lower.includes("implante") ||
    lower.includes("empaste")
  ) {
    let termino = "limpieza";
    if (lower.includes("blanqueamiento")) termino = "blanqueamiento";
    else if (lower.includes("ortodoncia")) termino = "ortodoncia";
    else if (lower.includes("implante")) termino = "implante";
    else if (lower.includes("empaste")) termino = "empaste";

    const tRes = await executeTool("consultar_servicios", { termino }, { isSafeMode: isSafe });
    timeline.push(tRes);
    toolsUsed.push({ name: "consultar_servicios", args: { termino }, result: tRes.summary });

    const serv = tRes.result?.[0];
    if (serv) {
      reply = `¡Hola! Nuestro tratamiento de ${serv.nombre} tiene un precio de ${serv.precio} y la duración estimada es de ${serv.duracion}. ${
        serv.requiereValoracionPrevia ? "Requiere una primera valoración previa en consulta. " : ""
      }¿Te gustaría que busquemos un hueco libre en la agenda para ti?`;
    } else {
      reply = `Disponemos de tratamientos avanzados en la clínica. ¿Te gustaría consultar huecos para una primera revisión gratuita y diagnóstico sin compromiso?`;
    }
  }
  // 2. Detectar si quiere pedir cita o hueco
  else if (
    lower.includes("cita") ||
    lower.includes("hueco") ||
    lower.includes("hora") ||
    lower.includes("mañana") ||
    lower.includes("viernes")
  ) {
    const calRes = await executeTool("consultar_huecos_libres", { fecha: "2026-10-24" }, { isSafeMode: isSafe });
    timeline.push(calRes);
    toolsUsed.push({ name: "consultar_huecos_libres", args: { fecha: "2026-10-24" }, result: calRes.summary });

    // Si ya da su nombre o confirmación, simular crear cita
    if (lower.includes("10:00") || lower.includes("12:30") || lower.includes("17:00") || lower.includes("me viene bien") || lower.includes("quiero")) {
      const citaRes = await executeTool(
        "crear_cita",
        {
          servicio: "Primera visita y revisión",
          fechaHoraInicio: "2026-10-24T10:00:00+02:00",
          nombreCliente: "Paciente de Prueba",
          telefonoCliente: "+34 611 22 33 44",
        },
        { isSafeMode: isSafe }
      );
      timeline.push(citaRes);
      toolsUsed.push({ name: "crear_cita", args: citaRes.args, result: citaRes.summary });

      reply = `¡Perfecto! He reservado tu cita para el viernes a las 10:00h en Clínica Dental Lumen (Calle Gran Vía 32). Te esperamos puntualmente. ¿Deseas que te enviemos confirmación por correo?`;
    } else {
      reply = `He consultado la agenda y tenemos los siguientes huecos libres disponibles:\n• 10:00h\n• 12:30h\n• 17:00h\n¿Cuál de estas opciones te encaja mejor?`;
    }
  }
  // 3. Detectar urgencia o dolor
  else if (
    lower.includes("dolor") ||
    lower.includes("urgencia") ||
    lower.includes("sangre") ||
    lower.includes("flemón") ||
    lower.includes("duele")
  ) {
    const hRes = await executeTool(
      "pasar_a_humano",
      { motivo: "Paciente con dolor agudo o posible urgencia odontológica" },
      { isSafeMode: isSafe }
    );
    timeline.push(hRes);
    toolsUsed.push({ name: "pasar_a_humano", args: hRes.args, result: hRes.summary });

    reply = `Siento mucho que estés pasando por ese dolor. Al tratarse de una urgencia, he transferido de inmediato tu caso a una persona de nuestro equipo clínico para atenderte de forma prioritaria. Si necesitas asistencia inmediata, puedes llamarnos directamente al 912 345 678.`;
  }
  // 4. Saludo o respuesta general
  else {
    reply = `¡Hola! Soy Sintia, asistente de Clínica Dental Lumen. ¿En qué puedo ayudarte hoy? Puedo informarte sobre precios de tratamientos, resolver dudas sobre seguros y aparcamiento o darte cita en la agenda.`;
  }

  return {
    reply,
    timeline,
    toolsUsed,
    modelUsed: "local/demo-assistant",
  };
}
