"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "@/components/ui/Toast";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Smartphone,
  Globe,
  Power,
  Copy,
  Check,
  ExternalLink,
  Save,
  CheckCircle2,
  RefreshCw,
  LogOut,
  QrCode,
} from "lucide-react";

interface WhatsAppState {
  status: "disconnected" | "waiting_qr" | "connected";
  qrCode: string | null;
  connectedNumber: string | null;
  connectedName: string | null;
}

export default function CanalesPage() {
  // Estado WhatsApp (SSE)
  const [waState, setWaState] = useState<WhatsAppState>({
    status: "disconnected",
    qrCode: null,
    connectedNumber: null,
    connectedName: null,
  });
  const [waDisconnecting, setWaDisconnecting] = useState(false);

  // Estado Webchat
  const [webActive, setWebActive] = useState(true);
  const [widgetColor, setWidgetColor] = useState("#0284c7");
  const [welcomeText, setWelcomeText] = useState("¡Hola! ¿Tienes dudas o quieres pedir cita? Escríbenos.");
  const [webSaving, setWebSaving] = useState(false);
  const [webSaved, setWebSaved] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Escuchar stream SSE de WhatsApp y fallback con polling
  useEffect(() => {
    let isMounted = true;

    // 1. Carga inicial inmediata por REST
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/channels/whatsapp/status");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            setWaState((prev) => ({
              status: data.status,
              qrCode: data.qrCode,
              connectedNumber: data.connectedNumber,
              connectedName: data.connectedName,
            }));
          }
        }
      } catch (e) {
        // Silencioso
      }
    };

    fetchStatus();

    // Polling de respaldo cada 3 segundos en caso de que SSE se interrumpa o bufferice
    const pollInterval = setInterval(fetchStatus, 3000);

    // 2. Conexión SSE en tiempo real
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/channels/whatsapp/sse");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (isMounted) {
            setWaState({
              status: data.status,
              qrCode: data.qrCode,
              connectedNumber: data.connectedNumber,
              connectedName: data.connectedName,
            });
          }
        } catch (err) {
          console.error("Error parseando SSE WhatsApp:", err);
        }
      };

      eventSource.onerror = () => {
        // El navegador reintentará automáticamente y el polling de respaldo sigue activo
      };
    } catch (e) {
      console.warn("EventSource no soportado o bloqueado:", e);
    }

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (eventSource) eventSource.close();
    };
  }, []);

  // Cargar configuración de Webchat
  useEffect(() => {
    fetch("/api/channels/webchat/config")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          if (data.isActive !== undefined) setWebActive(data.isActive);
          if (data.widgetColor) setWidgetColor(data.widgetColor);
          if (data.welcomeText) setWelcomeText(data.welcomeText);
        }
      });
  }, []);

  const handleDisconnectWhatsApp = async () => {
    const ok = await confirmDialog({
      title: "¿Desconectar WhatsApp?",
      description: "¿Deseas cerrar la sesión activa de WhatsApp? El bot dejará de responder mensajes en este número.",
      confirmText: "Desconectar",
      destructive: true,
    });
    if (!ok) return;

    setWaDisconnecting(true);
    try {
      await fetch("/api/channels/whatsapp/disconnect", { method: "POST" });
      toast.info("WhatsApp desconectado", "La sesión se ha cerrado correctamente.");
    } catch (err) {
      console.error(err);
      toast.error("Error", "No se pudo desconectar WhatsApp.");
    } finally {
      setWaDisconnecting(false);
    }
  };

  const handleSaveWebchat = async () => {
    setWebSaving(true);
    setWebSaved(false);
    try {
      const res = await fetch("/api/channels/webchat/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: webActive,
          widgetColor,
          welcomeText,
        }),
      });
      if (res.ok) {
        setWebSaved(true);
        setTimeout(() => setWebSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWebSaving(false);
    }
  };

  const appOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const embedCodeSnippet = `<!-- Widget de Chat Sintia para tu web -->
<script src="${appOrigin}/api/widget.js" defer></script>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* 1. CANAL WHATSAPP */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">WhatsApp Business / Personal</h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Conexión directa mediante Baileys y sincronización en disco.
                </div>
              </div>
            </div>

            <div>
              {waState.status === "connected" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado
                </span>
              ) : waState.status === "waiting_qr" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Esperando QR
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Desconectado
                </span>
              )}
            </div>
          </div>

          {/* Estado Conectado */}
          {waState.status === "connected" ? (
            <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {waState.connectedName || "WhatsApp Conectado"}
                </div>
                <div className="text-sm font-mono text-emerald-800 dark:text-emerald-300 font-semibold mt-1">
                  {waState.connectedNumber}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                  El asistente está atendiendo mensajes entrantes, aplicando el filtro de 8 segundos y respondiendo a los clientes.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDisconnectWhatsApp}
                disabled={waDisconnecting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 shadow-xs transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{waDisconnecting ? "Desconectando..." : "Desconectar número"}</span>
              </button>
            </div>
          ) : (
            /* Estado Esperando QR o Desconectado */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Pasos para conectar:</div>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <li>Abre WhatsApp en tu teléfono móvil.</li>
                  <li>Ve a <strong>Ajustes &gt; Dispositivos vinculados</strong>.</li>
                  <li>Toca en <strong>Vincular un dispositivo</strong> y enfoca este código QR.</li>
                </ol>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 flex flex-col items-center justify-center min-h-[340px] text-center">
                {waState.qrCode ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={waState.qrCode}
                        alt="Código QR de WhatsApp"
                        className="w-64 h-64 object-contain mx-auto rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                      <span>El código se actualiza automáticamente en vivo</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-slate-400 dark:text-slate-500">
                    <QrCode className="w-16 h-16 stroke-1 mx-auto text-slate-300 dark:text-slate-600 animate-pulse" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Iniciando conexión con Baileys...
                    </div>
                    <p className="text-[11px] max-w-xs text-slate-400 dark:text-slate-500">
                      El proceso Worker está arrancando el socket. El código QR aparecerá aquí en unos segundos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. CANAL CHAT WEB */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Chat para tu Web</h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Burbuja interactiva embebible mediante una sola etiqueta script.
                </div>
              </div>
            </div>

            <button
              onClick={() => setWebActive(!webActive)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                webActive
                  ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{webActive ? "Activo" : "Pausado"}</span>
            </button>
          </div>

          {/* Configuración del Widget */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Color de acento de la burbuja
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={widgetColor}
                  onChange={(e) => setWidgetColor(e.target.value)}
                  className="w-10 h-10 p-0 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer overflow-hidden bg-transparent"
                />
                <input
                  type="text"
                  value={widgetColor}
                  onChange={(e) => setWidgetColor(e.target.value)}
                  className="w-28 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-xs"
                />
                <div className="flex items-center gap-1.5">
                  {["#0284c7", "#4f46e5", "#059669", "#dc2626", "#d97706", "#0f172a"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setWidgetColor(c)}
                      style={{ background: c }}
                      className="w-6 h-6 rounded-full border border-black/10 dark:border-white/20 transition transform hover:scale-110"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Texto de bienvenida del chat web
              </label>
              <textarea
                rows={2}
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
              />
            </div>

            {/* Código embebible */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Fragmento de código para cualquier web
                </label>
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet ? "Copiado" : "Copiar código"}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-900 dark:bg-black text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                <code>{embedCodeSnippet}</code>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Pega esta línea justo antes del cierre de la etiqueta <code className="font-mono text-slate-600 dark:text-slate-400">&lt;/body&gt;</code> en tu web (WordPress, Shopify, Webflow, etc.).
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <Link
                href="/demo"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver página /demo con el widget</span>
              </Link>

              <button
                type="button"
                onClick={handleSaveWebchat}
                disabled={webSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
              >
                {webSaving ? (
                  <span>Guardando...</span>
                ) : webSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Guardado</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
