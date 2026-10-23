"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  PlayCircle,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Send,
  Bot,
  User,
  Sparkles,
  Calendar,
  Mail,
  CreditCard,
  Clock,
  ChevronDown,
  ChevronRight,
  Zap,
} from "lucide-react";

interface TimelineItem {
  toolName: string;
  args: any;
  result: any;
  simulated: boolean;
  status: "success" | "error";
  summary: string;
  timestamp: string;
}

interface MessageItem {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  toolsUsed?: any[];
}

export default function ProbarPage() {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome-msg",
      sender: "assistant",
      text: "¡Hola! Con mucho gusto le atiende Sintia, asistente virtual de la Clínica Dental Lumen en Bocagrande, Cartagena de Indias. ¿En qué le puedo colaborar hoy? Puede consultarme sobre citas, horarios, tratamientos o medios de pago.",
      timestamp: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(true);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [expandedTimelineSteps, setExpandedTimelineSteps] = useState<Record<number, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText("");

    const userMsg: MessageItem = {
      id: "usr-" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch("/api/test-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          isSafeMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al recibir respuesta del asistente.");
      }

      if (data.timeline && data.timeline.length > 0) {
        const newTimelineItems = data.timeline.map((item: any) => ({
          ...item,
          timestamp: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Bogota" }),
        }));
        setTimeline((prev) => [...prev, ...newTimelineItems]);
      }

      const assistantMsg: MessageItem = {
        id: "ast-" + Date.now(),
        sender: "assistant",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" }),
        toolsUsed: data.toolsUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: "err-" + Date.now(),
        sender: "assistant",
        text: `Error de conexión: ${err.message}`,
        timestamp: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: "welcome-msg-" + Date.now(),
        sender: "assistant",
        text: "¡Hola! Conversación reiniciada. ¿En qué le puedo colaborar hoy?",
        timestamp: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" }),
      },
    ]);
    setTimeline([]);
  };

  const getToolIcon = (name: string) => {
    switch (name) {
      case "consultar_huecos_libres":
      case "crear_cita":
      case "cambiar_cita":
      case "cancelar_cita":
        return <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case "enviar_confirmacion_cita":
        return <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "crear_enlace_pago_senal":
        return <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "notificar_al_equipo":
        return <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 transition-colors">
      {/* Barra Superior con Controles y Modo Seguro */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Probar Asistente</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Entorno Interactivo
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prueba cómo interactúa Sintia y observa a la derecha cada herramienta ejecutada en vivo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Interruptor Modo Seguro */}
          <button
            onClick={() => setIsSafeMode(!isSafeMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
              isSafeMode
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            }`}
          >
            {isSafeMode ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Modo Seguro: ACTIVO</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span>Modo Seguro: DESACTIVADO (Acciones Reales)</span>
              </>
            )}
          </button>

          {/* Botón Nueva Conversación */}
          <button
            onClick={handleResetConversation}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
            title="Empezar una conversación nueva"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid de 2 Columnas: Chat a la izquierda y Timeline a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: CHAT DEL CLIENTE (7 columnas en desktop) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[650px] overflow-hidden transition-colors">
          {/* Cabecera del Chat */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Sintia • Asistente Virtual</div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En línea (Europe/Madrid)
                </div>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Canal: Prueba Interna</span>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-indigo-200/50 dark:border-indigo-800/50">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[80%] space-y-1">
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      m.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-xs shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/50 dark:border-slate-700/60"
                    }`}
                  >
                    {m.text}
                  </div>

                  <div
                    className={`text-[10px] text-slate-400 dark:text-slate-500 px-1 ${
                      m.sender === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-tl-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Preguntas de Prueba Rápidas */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 overflow-x-auto flex items-center gap-2 text-xs">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
              Probar:
            </span>
            {[
              "¿Cuánto cuesta el blanqueamiento dental?",
              "¿Qué huecos tienen para este viernes por la mañana?",
              "Tengo un dolor agudo y urgencia tras una extracción",
              "¿Cuentan con parqueadero en la clínica?",
            ].map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700 whitespace-nowrap text-[11px] transition shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input de Envío */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe como si fueras un paciente..."
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: LÍNEA DE TIEMPO DE HERRAMIENTAS (5 columnas en desktop) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[650px] overflow-hidden transition-colors">
          {/* Cabecera Timeline */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Línea de Tiempo de Herramientas ({timeline.length})</span>
            </div>
            {isSafeMode && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Escritura Simulada
              </span>
            )}
          </div>

          {/* Lista de pasos del Timeline */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {timeline.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 space-y-2">
                <PlayCircle className="w-10 h-10 stroke-1 text-slate-300 dark:text-slate-700" />
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Línea de tiempo vacía</div>
                <p className="text-[11px] max-w-xs text-slate-400 dark:text-slate-500">
                  Envía un mensaje pidiendo una cita o precios para ver aquí cómo el modelo llama a las herramientas paso a paso.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {timeline.map((item, idx) => {
                  const isExpanded = !!expandedTimelineSteps[idx];

                  return (
                    <div key={idx} className="relative group">
                      {/* Nodo icono */}
                      <div className="absolute -left-6 top-0 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 dark:border-indigo-500 flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-slate-200 shadow-xs">
                        {idx + 1}
                      </div>

                      {/* Tarjeta del paso */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getToolIcon(item.toolName)}
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                              {item.toolName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.timestamp}</span>
                        </div>

                        {/* Resumen visible */}
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                          {item.summary}
                        </div>

                        {item.simulated && (
                          <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                            Simulado en Modo Seguro
                          </div>
                        )}

                        {/* Desplegable de parámetros y respuesta */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTimelineSteps({
                                ...expandedTimelineSteps,
                                [idx]: !isExpanded,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                            <span>{isExpanded ? "Ocultar detalles técnicos" : "Ver parámetros y respuesta JSON"}</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-2 text-[10px] font-mono">
                              <div className="bg-slate-900 dark:bg-black text-slate-200 p-2.5 rounded-lg overflow-x-auto border border-slate-800">
                                <div className="text-slate-400 font-bold mb-1">// Argumentos enviados:</div>
                                <pre>{JSON.stringify(item.args, null, 2)}</pre>
                              </div>
                              <div className="bg-slate-900 dark:bg-black text-slate-200 p-2.5 rounded-lg overflow-x-auto border border-slate-800">
                                <div className="text-slate-400 font-bold mb-1">// Respuesta obtenida:</div>
                                <pre>{JSON.stringify(item.result, null, 2)}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
