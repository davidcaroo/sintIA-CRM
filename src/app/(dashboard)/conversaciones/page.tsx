"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
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
  AlertCircle,
  Radio,
  CheckCircle2,
  Calendar,
  Sparkles,
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

  // Conversación activa
  const [activeConv, setActiveConv] = useState<any>(null);
  const [loadingConv, setLoadingConv] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [sseConnected, setSseConnected] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(() => {
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
      .catch((err) => console.error("Error cargando conversaciones:", err))
      .finally(() => setLoading(false));
  }, [filter, selectedId]);

  // Carga inicial y respaldo periódico
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 3000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Cargar conversación individual
  const loadActiveConversation = useCallback((id: string, isSilent = false) => {
    if (!isSilent) setLoadingConv(true);
    fetch(`/api/conversations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.conversation) {
          setActiveConv((prev: any) => {
            if (prev && prev.id === data.conversation.id && prev.messages?.length === data.conversation.messages?.length) {
              return prev;
            }
            return data.conversation;
          });
        }
      })
      .catch((err) => console.error("Error al cargar chat:", err))
      .finally(() => {
        if (!isSilent) setLoadingConv(false);
      });
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadActiveConversation(selectedId, false);
      const interval = setInterval(() => loadActiveConversation(selectedId, true), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedId, loadActiveConversation]);

  // Desplazamiento automático al final sólo dentro del contenedor de chat
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeConv?.messages]);

  // Conexión Server-Sent Events (SSE) en tiempo real
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSse = () => {
      try {
        eventSource = new EventSource("/api/conversations/stream");

        eventSource.addEventListener("connected", () => {
          setSseConnected(true);
        });

        eventSource.addEventListener("message:new", (e) => {
          try {
            const data = JSON.parse(e.data);
            const { conversationId, message } = data;

            // 1. Si es de la conversación seleccionada, agregar al hilo
            if (selectedId && conversationId === selectedId) {
              setActiveConv((prev: any) => {
                if (!prev || prev.id !== conversationId) return prev;
                // Evitar duplicados
                const exists = prev.messages?.some((m: any) => m.id === message.id);
                if (exists) return prev;
                return {
                  ...prev,
                  messages: [...(prev.messages || []), message],
                };
              });
            }

            // 2. Actualizar lista de conversaciones izquierda
            setConversations((prev) => {
              const idx = prev.findIndex((c) => c.id === conversationId);
              if (idx === -1) {
                // Conversación nueva: recargar lista completa
                loadConversations();
                return prev;
              }
              const updated = [...prev];
              updated[idx] = {
                ...updated[idx],
                lastMessageAt: message.createdAt || new Date().toISOString(),
                messages: [message],
              };
              // Mover al inicio de la lista
              const [item] = updated.splice(idx, 1);
              return [item, ...updated];
            });
          } catch (err) {
            console.error("Error procesando evento SSE message:new:", err);
          }
        });

        eventSource.addEventListener("conversation:updated", (e) => {
          try {
            const data = JSON.parse(e.data);
            setConversations((prev) => {
              const idx = prev.findIndex((c) => c.id === data.conversationId);
              if (idx === -1) return prev;
              const updated = [...prev];
              updated[idx] = {
                ...updated[idx],
                lastMessageAt: data.lastMessageAt || updated[idx].lastMessageAt,
                status: data.status || updated[idx].status,
              };
              return updated;
            });
          } catch {}
        });

        eventSource.addEventListener("conversation:takeover", (e) => {
          try {
            const data = JSON.parse(e.data);
            const newStatus = data.status === "human" ? "human_handoff" : "bot";
            if (selectedId === data.conversationId) {
              setActiveConv((prev: any) => (prev ? { ...prev, status: newStatus } : prev));
            }
            setConversations((prev) =>
              prev.map((c) => (c.id === data.conversationId ? { ...c, status: newStatus } : c))
            );
          } catch {}
        });

        eventSource.onerror = () => {
          setSseConnected(false);
          eventSource?.close();
          // Intentar reconectar tras 4 segundos
          reconnectTimeout = setTimeout(connectSse, 4000);
        };
      } catch (err) {
        setSseConnected(false);
        reconnectTimeout = setTimeout(connectSse, 4000);
      }
    };

    connectSse();

    return () => {
      clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, [selectedId, loadConversations]);

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

    const text = replyText.trim();
    setSendingReply(true);
    setReplyText("");

    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        loadActiveConversation(selectedId);
      } else {
        // En caso de fallo, restaurar texto
        setReplyText(text);
      }
    } catch (err) {
      console.error(err);
      setReplyText(text);
    } finally {
      setSendingReply(false);
    }
  };

  const filteredList = conversations.filter((c) => {
    if (filter === "handoff" && c.status !== "human_handoff") return false;
    if (filter === "whatsapp" && c.channel !== "whatsapp") return false;
    if (filter === "web" && c.channel !== "web") return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (c.contact?.name || "").toLowerCase();
    const phone = (c.contact?.phone || "").toLowerCase();
    const lastMsg = (c.messages?.[0]?.text || "").toLowerCase();
    return name.includes(q) || phone.includes(q) || lastMsg.includes(q);
  });

  const countHandoff = conversations.filter((c) => c.status === "human_handoff").length;

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col transition-colors">
      {/* Contenedor Principal de Dos Columnas estilo Vocero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden flex-1 h-full min-h-0">
        {/* COLUMNA IZQUIERDA: LISTA Y FILTROS ESTILO VOCERO (5 cols) */}
        <div className="lg:col-span-5 border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-full min-h-0 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
          {/* Buscador */}
          <div className="p-3 border-b border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente, teléfono o mensaje..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition"
              />
            </div>
          </div>

          {/* Filtros estilo Tabs Vocero */}
          <div className="px-3 py-2 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center gap-1 overflow-x-auto bg-slate-100/50 dark:bg-slate-900/60 text-xs">
            {[
              { id: "all", label: "Todas", count: conversations.length },
              { id: "handoff", label: "En mano humana", count: countHandoff },
              { id: "whatsapp", label: "WhatsApp" },
              { id: "web", label: "Web" },
            ].map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                    active
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs border border-slate-200/80 dark:border-slate-700 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <span>{f.label}</span>
                  {f.count !== undefined && f.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                        f.id === "handoff"
                          ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold"
                          : active
                          ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Lista de Conversaciones con scroll interno */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Sincronizando bandeja...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No hay conversaciones en esta vista.
              </div>
            ) : (
              filteredList.map((c) => {
                const isSelected = selectedId === c.id;
                const isHandoff = c.status === "human_handoff";
                const lastMsg = c.messages?.[0];

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`p-3 cursor-pointer transition flex items-start gap-2.5 text-xs relative ${
                      isSelected
                        ? "bg-slate-100/80 dark:bg-slate-800/70"
                        : "hover:bg-white/80 dark:hover:bg-slate-900/60 bg-transparent"
                    }`}
                  >
                    {/* Borde activo sutil estilo Vocero */}
                    {isSelected && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900 dark:bg-slate-100 rounded-r" />
                    )}

                    {/* Avatar con badge integrado de canal */}
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center uppercase text-[11px] border border-slate-300/40 dark:border-slate-700">
                        {(c.contact?.name || "C").slice(0, 2)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white dark:border-slate-900 ${
                          c.channel === "whatsapp" ? "bg-emerald-500 text-white" : "bg-sky-500 text-white"
                        }`}
                        title={c.channel === "whatsapp" ? "WhatsApp" : "Chat Web"}
                      >
                        {c.channel === "whatsapp" ? (
                          <Smartphone className="w-2 h-2" />
                        ) : (
                          <Globe className="w-2 h-2" />
                        )}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate text-xs">
                          {c.contact?.name || c.contact?.phone || "Cliente"}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
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
                        {isHandoff ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900">
                            <UserCheck className="w-2.5 h-2.5" />
                            Mano humana
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Atiende Sintia
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

        {/* COLUMNA DERECHA: CONVERSACIÓN ABIERTA (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 overflow-hidden bg-slate-50/30 dark:bg-slate-900/40 transition-colors">
          {activeConv ? (
            <>
              {/* Cabecera del chat activo estilo Vocero */}
              <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center uppercase text-xs border border-slate-200 dark:border-slate-700 shrink-0">
                    {(activeConv.contact?.name || "C").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                        {activeConv.contact?.name || "Cliente"}
                      </span>
                      {activeConv.contact?.phone && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          {activeConv.contact.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="capitalize">{activeConv.channel}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            activeConv.status === "human_handoff" ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                        <strong
                          className={`font-medium ${
                            activeConv.status === "human_handoff"
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {activeConv.status === "human_handoff" ? "Control Humano" : "Sintia Activa"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón Takeover minimalista */}
                <div className="shrink-0">
                  {activeConv.status === "human_handoff" ? (
                    <button
                      type="button"
                      onClick={() => handleTakeover("release")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Devolver a Sintia</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTakeover("takeover")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span>Tomar control manual</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Banner de Silencio Asistente si está en mano humana */}
              {activeConv.status === "human_handoff" && (
                <div className="px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    El asistente Sintia está en pausa para este chat. Las respuestas enviadas abajo van directamente al cliente.
                  </span>
                </div>
              )}

              {/* Hilo de Mensajes con Burbujas Refinadas */}
              <div ref={messagesContainerRef} className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 bg-slate-50/60 dark:bg-slate-950/40">
                {activeConv.messages?.map((msg: FullMessage) => {
                  const isClient = msg.sender === "client";
                  const isHuman = msg.sender === "human";
                  const isAssistant = msg.sender === "assistant";
                  const tools = (msg.toolsUsed as any[]) || [];
                  const isToolsOpen = !!expandedTools[msg.id];

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isClient ? "justify-start" : "justify-end"}`}
                    >
                      {isClient && (
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1 border border-slate-300/40 dark:border-slate-700">
                          <User className="w-3 h-3" />
                        </div>
                      )}

                      <div className="max-w-[78%] space-y-1">
                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                            isClient
                              ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/90 dark:border-slate-800 shadow-2xs"
                              : isHuman
                              ? "bg-emerald-700 text-white rounded-tr-xs shadow-2xs"
                              : "bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-50 rounded-tr-xs shadow-2xs border border-slate-800 dark:border-slate-700/80"
                          }`}
                        >
                          {/* Cabecera sutil del emisor */}
                          <div className="flex items-center justify-between gap-2 mb-1 opacity-70 text-[10px] font-medium">
                            <span>
                              {isClient
                                ? activeConv.contact?.name || "Cliente"
                                : isHuman
                                ? "Persona del Equipo"
                                : "Sintia (Asistente)"}
                            </span>
                            <span className="font-mono text-[9px]">
                              {new Date(msg.createdAt).toLocaleTimeString("es-CO", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "America/Bogota",
                              })}
                            </span>
                          </div>

                          <div className="text-[12px]">{msg.text}</div>

                          {/* Chips Técnicos de Herramientas Ejecutadas */}
                          {isAssistant && tools.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedTools({
                                    ...expandedTools,
                                    [msg.id]: !isToolsOpen,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-300 transition"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                <span>{tools.length} herramienta{tools.length > 1 ? "s" : ""} ejecutada{tools.length > 1 ? "s" : ""}</span>
                                {isToolsOpen ? (
                                  <ChevronDown className="w-3 h-3 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-slate-400" />
                                )}
                              </button>

                              {isToolsOpen && (
                                <div className="mt-2 p-2 rounded-lg bg-slate-950 text-[10px] font-mono space-y-1.5 text-slate-300 border border-slate-800">
                                  {tools.map((t: any, idx: number) => (
                                    <div key={idx} className="border-b border-slate-800/80 pb-1 last:border-0 last:pb-0">
                                      <div className="text-emerald-400 font-bold flex items-center gap-1">
                                        <span>•</span> {t.name}
                                      </div>
                                      <div className="text-slate-400 text-[9px] mt-0.5">
                                        {typeof t.result === "string"
                                          ? t.result
                                          : JSON.stringify(t.result)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isClient && (
                        <div
                          className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-1 ${
                            isHuman ? "bg-emerald-800" : "bg-slate-800"
                          }`}
                        >
                          {isHuman ? <UserCheck className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>

              {/* Formulario de Envío de Respuesta Humana */}
              <form
                onSubmit={handleSendHumanReply}
                className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    activeConv.status === "human_handoff"
                      ? "Escribe tu respuesta como persona del equipo... (Enter para enviar)"
                      : "Toma el control para responder manualmente al cliente..."
                  }
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-40 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Enviar</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center space-y-2">
              <MessageSquare className="w-10 h-10 stroke-1 text-slate-300 dark:text-slate-700" />
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Selecciona una conversación
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
                Elige un cliente de la lista para leer su historial o responderle en vivo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
