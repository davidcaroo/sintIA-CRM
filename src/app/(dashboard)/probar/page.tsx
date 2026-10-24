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
  FlaskConical,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { PERSONAS, LabPersona } from "@/lib/lab/personas";

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
  const [activeTab, setActiveTab] = useState<"simulator" | "lab">("simulator");

  // Estados del Simulador Manual
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

  // Estados del Laboratorio de Calidad
  const [labRunning, setLabRunning] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("all");
  const [labResults, setLabResults] = useState<any[] | null>(null);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [overallVerdict, setOverallVerdict] = useState<"verde" | "amarillo" | "rojo" | null>(null);
  const [faqSuggestions, setFaqSuggestions] = useState<{ pregunta: string; respuesta: string }[]>([]);
  const [addedFaqs, setAddedFaqs] = useState<Record<number, boolean>>({});
  const [addingFaqIndex, setAddingFaqIndex] = useState<number | null>(null);
  const [expandedPersona, setExpandedPersona] = useState<string | null>("comprador_decidido");

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "simulator") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, activeTab]);

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

  // Ejecución del Laboratorio de Calidad
  const handleRunLab = async () => {
    setLabRunning(true);
    try {
      const res = await fetch("/api/lab/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: selectedPersonaId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error ejecutando corrida del laboratorio.");
      }

      setAverageScore(data.averageScore);
      setOverallVerdict(data.overallVerdict);
      setLabResults(data.results);
      setFaqSuggestions(data.allFaqSuggestions || []);
      if (data.results && data.results.length > 0) {
        setExpandedPersona(data.results[0].persona.id);
      }
    } catch (err: any) {
      alert(`Error en el laboratorio: ${err.message}`);
    } finally {
      setLabRunning(false);
    }
  };

  const handleAddFaq = async (faq: { pregunta: string; respuesta: string }, index: number) => {
    setAddingFaqIndex(index);
    try {
      const res = await fetch("/api/lab/add-faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: faq.pregunta,
          answer: faq.respuesta,
          category: "Laboratorio QA",
        }),
      });

      if (res.ok) {
        setAddedFaqs((prev) => ({ ...prev, [index]: true }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingFaqIndex(null);
    }
  };

  const getToolIcon = (name: string) => {
    switch (name) {
      case "consultar_huecos_libres":
      case "crear_cita":
      case "cambiar_cita":
      case "cancelar_cita":
        return <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
      case "enviar_confirmacion_cita":
        return <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "crear_enlace_pago_senal":
        return <CreditCard className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 transition-colors max-w-7xl mx-auto">
      {/* Barra de Pestañas */}
      <div className="flex items-center justify-end gap-4 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        {/* Pestañas Principales */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === "simulator"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Simulador Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lab")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === "lab"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Laboratorio de Calidad (0-100)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              NUEVO
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: SIMULADOR MANUAL (Chat interactivo + Timeline)                 */}
      {/* ========================================================================= */}
      {activeTab === "simulator" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  isSafeMode
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                }`}
              >
                {isSafeMode ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                )}
                {isSafeMode ? "Modo Seguro (Sin escrituras reales)" : "Modo Real (Escribe en Google/Stripe)"}
              </span>

              <button
                type="button"
                onClick={() => setIsSafeMode(!isSafeMode)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-2 ml-1"
              >
                Cambiar a {isSafeMode ? "Modo Real" : "Modo Seguro"}
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetConversation}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar chat
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[680px]">
            {/* Columna Izquierda: Chat */}
            <div className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Sintia Asistente Virtual
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  Canal Web Simulado
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-slate-950/30">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-slate-800 flex items-center justify-center shrink-0 text-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-tr-xs"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-xs shadow-2xs"
                      }`}
                    >
                      {msg.text}
                      <div className="text-[9px] opacity-60 mt-1 font-mono text-right">{msg.timestamp}</div>
                    </div>
                    {msg.sender === "user" && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 text-xs font-bold">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                    <span>Sintia está razonando...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe un mensaje de prueba..."
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  disabled={loading || !inputText.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </form>
            </div>

            {/* Columna Derecha: Timeline de Herramientas */}
            <div className="lg:col-span-5 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Línea de Tiempo de Razonamiento
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {timeline.length} llamada{timeline.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {timeline.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 p-6 space-y-2">
                    <Sparkles className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-700" />
                    <div className="text-xs font-semibold">Sin herramientas ejecutadas aún</div>
                    <p className="text-[11px] max-w-xs">
                      Envía un mensaje preguntando por horarios, precios o citas para ver el razonamiento y llamadas a herramientas en vivo.
                    </p>
                  </div>
                ) : (
                  timeline.map((step, idx) => {
                    const isOpen = !!expandedTimelineSteps[idx];
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/40 dark:bg-slate-950/40 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            {getToolIcon(step.toolName)}
                            <span>{step.toolName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{step.timestamp}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">{step.summary}</div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTimelineSteps((prev) => ({
                              ...prev,
                              [idx]: !isOpen,
                            }))
                          }
                          className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1"
                        >
                          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          <span>{isOpen ? "Ocultar detalle técnico" : "Ver parámetros y respuesta"}</span>
                        </button>

                        {isOpen && (
                          <div className="mt-2 p-2 rounded bg-slate-900 text-slate-200 font-mono text-[10px] space-y-1 overflow-x-auto">
                            <div>
                              <strong className="text-amber-400">Args:</strong> {JSON.stringify(step.args, null, 2)}
                            </div>
                            <div>
                              <strong className="text-emerald-400">Result:</strong>{" "}
                              {typeof step.result === "string" ? step.result : JSON.stringify(step.result, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: LABORATORIO DE CALIDAD ESTILO VOCERO (Calificación 0 a 100)    */}
      {/* ========================================================================= */}
      {activeTab === "lab" && (
        <div className="space-y-6">
          {/* Tarjeta de Control Superior */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Suite de Auto-Evaluación
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Auditoría Automática contra la Base de Conocimiento
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ejecuta guiones deterministas con clientes sintéticos y un Juez LLM evalúa alucinaciones, respuestas fuera de catálogo, tono y omisión de traspaso médico de 0 a 100.
              </p>
            </div>

            {/* Selector de Persona y Botón de Ejecución */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={selectedPersonaId}
                onChange={(e) => setSelectedPersonaId(e.target.value)}
                disabled={labRunning}
                className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
              >
                <option value="all">Todas las personas (Suite completa)</option>
                {PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleRunLab}
                disabled={labRunning}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-xs"
              >
                {labRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluando...</span>
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Ejecutar Laboratorio</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Banner de Ejecución en Progreso */}
          {labRunning && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-slate-900 dark:text-slate-100 animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Corriendo simulación sandbox con clientes sintéticos...
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                El agente está procesando cada turno con la base de conocimiento actual y el Juez de IA está auditando cada respuesta en busca de alucinaciones o faltas.
              </p>
            </div>
          )}

          {/* Resultados de la Evaluación */}
          {!labRunning && labResults && (
            <div className="space-y-6">
              {/* Tarjeta de Marcador 0 a 100 estilo Vocero */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    {/* Nota Circular / Badge Gigante */}
                    <div
                      className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-bold font-mono shrink-0 shadow-xs border ${
                        overallVerdict === "verde"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          : overallVerdict === "amarillo"
                          ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                          : "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800"
                      }`}
                    >
                      <span className="text-3xl tracking-tight leading-none">{averageScore}</span>
                      <span className="text-[10px] tracking-wider opacity-75 mt-0.5">/ 100</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            overallVerdict === "verde"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : overallVerdict === "amarillo"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          }`}
                        >
                          Veredicto: {overallVerdict?.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {labResults.length} caso{labResults.length > 1 ? "s" : ""} evaluado{labResults.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {overallVerdict === "verde"
                          ? "Calidad Óptima para Producción"
                          : overallVerdict === "amarillo"
                          ? "Aceptable con Oportunidades de Refinamiento"
                          : "Atención Requerida antes de Desplegar"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {labResults[0]?.verdict?.resumen}
                      </p>
                    </div>
                  </div>

                  {/* Leyenda de Tipos de Fallos */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Cero alucinaciones</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                      <span>Base de conocimiento</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>Traspaso a médico</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Award className="w-3.5 h-3.5 text-purple-500" />
                      <span>Tono y empatía</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recomendaciones Directas para la Base de Conocimiento */}
              {faqSuggestions.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                        Sube tu nota a 100: Preguntas Frecuentes recomendadas por el Juez
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">
                      {faqSuggestions.length} sugerencia{faqSuggestions.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {faqSuggestions.map((faq, idx) => {
                      const isAdded = !!addedFaqs[idx];
                      const isAdding = addingFaqIndex === idx;

                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs space-y-2 flex flex-col justify-between"
                        >
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {faq.pregunta}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                              {faq.respuesta}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddFaq(faq, idx)}
                            disabled={isAdded || isAdding}
                            className={`self-start px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center gap-1.5 ${
                              isAdded
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Añadida a Conocimiento</span>
                              </>
                            ) : isAdding ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Añadiendo...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Añadir a mi base de FAQs</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detalle por Persona Evaluada */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider px-1">
                  Desglose de Casos Evaluados
                </h4>

                <div className="space-y-3">
                  {labResults.map((r, idx) => {
                    const isOpen = expandedPersona === r.persona.id;
                    const verdictColor =
                      r.verdict.veredicto === "verde"
                        ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : r.verdict.veredicto === "amarillo"
                        ? "text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300"
                        : "text-red-700 bg-red-50 dark:bg-red-950/60 dark:text-red-300";

                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
                      >
                        {/* Cabecera del caso */}
                        <div
                          onClick={() => setExpandedPersona(isOpen ? null : r.persona.id)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${verdictColor}`}
                            >
                              {r.verdict.score}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                  {r.persona.nombre}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {r.persona.categoria}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {r.persona.descripcion}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {r.verdict.hallazgos.length > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                {r.verdict.hallazgos.length} hallazgo{r.verdict.hallazgos.length > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Sin faltas
                              </span>
                            )}
                            {isOpen ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Contenido desplegable: Transcripción y Hallazgos */}
                        {isOpen && (
                          <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4 bg-slate-50/40 dark:bg-slate-950/40">
                            {/* Hallazgos específicos */}
                            {r.verdict.hallazgos.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Observaciones del Juez
                                </div>
                                <div className="space-y-1.5">
                                  {r.verdict.hallazgos.map((h: any, hIdx: number) => (
                                    <div
                                      key={hIdx}
                                      className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2"
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                      <div className="space-y-0.5">
                                        <div className="font-bold text-[10px] uppercase tracking-wider">
                                          Falta: {h.tipo}
                                        </div>
                                        <div className="text-[11px]">{h.evidencia}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Transcripción paso a paso */}
                            <div className="space-y-2">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Transcripción del Diálogo Simulador
                              </div>
                              <div className="space-y-2 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                                {r.transcript.map((t: any, tIdx: number) => (
                                  <div
                                    key={tIdx}
                                    className={`flex gap-2 text-xs ${
                                      t.role === "cliente" ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-slate-100 font-medium"
                                    }`}
                                  >
                                    <strong
                                      className={`shrink-0 text-[10px] font-mono uppercase ${
                                        t.role === "cliente" ? "text-sky-600 dark:text-sky-400" : "text-emerald-600 dark:text-emerald-400"
                                      }`}
                                    >
                                      {t.role === "cliente" ? "[Cliente]" : "[Sintia]"}:
                                    </strong>
                                    <span className="leading-relaxed">{t.text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
