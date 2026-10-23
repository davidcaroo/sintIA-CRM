"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Search,
  Smartphone,
  Globe,
  UserCheck,
  Bot,
  User,
  Send,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

interface ConversationItem {
  id: string;
  channel: string;
  status: string;
  handoffReason: string | null;
  lastMessageAt: string;
  contact: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
  messages: {
    id: string;
    sender: string;
    text: string;
    createdAt: string;
  }[];
}

interface FullMessage {
  id: string;
  sender: "client" | "assistant" | "human";
  text: string;
  toolsUsed: any;
  createdAt: string;
}

export default function ConversacionesPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Conversación seleccionada
  const [activeConv, setActiveConv] = useState<any>(null);
  const [loadingConv, setLoadingConv] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = () => {
    fetch(`/api/conversations?filter=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.conversations) {
          setConversations(data.conversations);
          if (!selectedId && data.conversations.length > 0) {
            setSelectedId(data.conversations[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 6000);
    return () => clearInterval(interval);
  }, [filter]);

  // Cargar conversación individual
  const loadActiveConversation = (id: string) => {
    setLoadingConv(true);
    fetch(`/api/conversations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.conversation) {
          setActiveConv(data.conversation);
        }
      })
      .finally(() => setLoadingConv(false));
  };

  useEffect(() => {
    if (selectedId) {
      loadActiveConversation(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages]);

  const handleTakeover = async (action: "takeover" | "release") => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/conversations/${selectedId}/takeover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        loadActiveConversation(selectedId);
        loadConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendHumanReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedId || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      if (res.ok) {
        setReplyText("");
        loadActiveConversation(selectedId);
        loadConversations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  const filteredList = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (c.contact?.name || "").toLowerCase();
    const phone = (c.contact?.phone || "").toLowerCase();
    const lastMsg = (c.messages?.[0]?.text || "").toLowerCase();
    return name.includes(q) || phone.includes(q) || lastMsg.includes(q);
  });

  return (
    <div className="space-y-6 pb-12 transition-colors">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Bandeja de Conversaciones</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervisa los chats en vivo, consulta las herramientas utilizadas o toma el control humano.
          </p>
        </div>
      </div>

      {/* Layout de Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden h-[720px] transition-colors">
        {/* COLUMNA IZQUIERDA: LISTA Y FILTROS (5 columnas en desktop) */}
        <div className="lg:col-span-5 border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-full bg-slate-50/30 dark:bg-slate-900/60">
          {/* Buscador */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente, teléfono o texto..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Filtros Rápidos */}
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto bg-slate-50/50 dark:bg-slate-800/40">
            {[
              { id: "all", label: "Todas" },
              { id: "handoff", label: "Necesitan atención" },
              { id: "whatsapp", label: "WhatsApp" },
              { id: "web", label: "Web" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filter === f.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de Conversaciones */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">Cargando chats...</div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">No se encontraron conversaciones.</div>
            ) : (
              filteredList.map((c) => {
                const isSelected = selectedId === c.id;
                const isHandoff = c.status === "human_handoff";
                const lastMsg = c.messages?.[0];

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`p-3.5 cursor-pointer transition flex items-start gap-3 text-xs ${
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-950/60 border-l-4 border-l-indigo-600 dark:border-l-indigo-400"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                      {(c.contact?.name || "C").slice(0, 2)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {c.contact?.name || c.contact?.phone || "Cliente"}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                          {new Date(c.lastMessageAt).toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "America/Bogota",
                          })}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {lastMsg ? lastMsg.text : "Sin mensajes"}
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        {c.channel === "whatsapp" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                            <Smartphone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            WhatsApp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-sky-700 dark:text-sky-400 font-medium">
                            <Globe className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                            Web
                          </span>
                        )}

                        {isHandoff && (
                          <span className="px-1.5 py-0.2 rounded-md bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-900 font-bold text-[9px]">
                            Esperando persona
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: CONVERSACIÓN ABIERTA Y CONTROLES (7 columnas en desktop) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-white dark:bg-slate-900 transition-colors">
          {activeConv ? (
            <>
              {/* Cabecera del chat abierto */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center uppercase text-xs border border-indigo-200 dark:border-indigo-800">
                    {(activeConv.contact?.name || "C").slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {activeConv.contact?.name || "Cliente"}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {activeConv.contact?.phone}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      Canal: <strong className="capitalize text-slate-600 dark:text-slate-300">{activeConv.channel}</strong> • Estado:{" "}
                      <strong className={activeConv.status === "human_handoff" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                        {activeConv.status === "human_handoff" ? "En mano humana" : "Atendido por Sintia"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Botón Tomar el control / Devolver al asistente */}
                <div>
                  {activeConv.status === "human_handoff" ? (
                    <button
                      type="button"
                      onClick={() => handleTakeover("release")}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Devolver al asistente</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTakeover("takeover")}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Tomar el control</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Banner de Handoff si aplica */}
              {activeConv.status === "human_handoff" && (
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    El asistente está en silencio en esta conversación. Responde directamente desde el formulario inferior.
                  </span>
                </div>
              )}

              {/* Mensajes */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-slate-900/40">
                {activeConv.messages?.map((msg: FullMessage) => {
                  const isClient = msg.sender === "client";
                  const isHuman = msg.sender === "human";
                  const isAssistant = msg.sender === "assistant";
                  const tools = (msg.toolsUsed as any[]) || [];
                  const isToolsOpen = !!expandedTools[msg.id];

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isClient ? "justify-start" : "justify-end"}`}
                    >
                      {isClient && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}

                      <div className="max-w-[75%] space-y-1">
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                            isClient
                              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                              : isHuman
                              ? "bg-emerald-600 text-white rounded-tr-xs shadow-xs"
                              : "bg-indigo-600 text-white rounded-tr-xs shadow-xs"
                          }`}
                        >
                          {/* Etiqueta del emisor */}
                          <div className="text-[10px] opacity-75 font-semibold mb-1">
                            {isClient
                              ? activeConv.contact?.name || "Cliente"
                              : isHuman
                              ? "Persona del Equipo"
                              : "Sintia (Asistente)"}
                          </div>

                          {msg.text}

                          {/* Botón de despliegue de herramientas usadas */}
                          {isAssistant && tools.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-indigo-400/40">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedTools({
                                    ...expandedTools,
                                    [msg.id]: !isToolsOpen,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-100 hover:text-white"
                              >
                                {isToolsOpen ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                                <span>Herramientas utilizadas ({tools.length})</span>
                              </button>

                              {isToolsOpen && (
                                <div className="mt-1.5 p-2 rounded-lg bg-indigo-950/60 text-[10px] font-mono space-y-1 text-slate-200">
                                  {tools.map((t: any, idx: number) => (
                                    <div key={idx}>
                                      <strong className="text-indigo-300">{t.name}</strong>: {t.result}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div
                          className={`text-[10px] text-slate-400 dark:text-slate-500 px-1 ${
                            isClient ? "text-left" : "text-right"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "America/Bogota",
                          })}
                        </div>
                      </div>

                      {!isClient && (
                        <div
                          className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isHuman ? "bg-emerald-700" : "bg-indigo-700"
                          }`}
                        >
                          {isHuman ? <UserCheck className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Formulario de respuesta para el humano */}
              <form
                onSubmit={handleSendHumanReply}
                className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    activeConv.status === "human_handoff"
                      ? "Escribe tu respuesta como persona del equipo..."
                      : "Toma el control para responder como persona del equipo..."
                  }
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-400"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center space-y-2">
              <MessageSquare className="w-12 h-12 stroke-1 text-slate-300 dark:text-slate-700" />
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Selecciona una conversación</div>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                Elige un cliente de la columna izquierda para leer su historial o responderle directamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
