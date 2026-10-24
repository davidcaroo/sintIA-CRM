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
  LogOut,
  KeyRound,
  Link2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

interface WhatsAppState {
  status: "disconnected" | "connected" | "error";
  connectedNumber: string | null;
  connectedName: string | null;
  wabaId: string;
  phoneNumberId: string;
  reminderTemplate: string;
  reminderTemplateLang: string;
  tokenMasked: string | null;
  webhookUrl: string;
  verifyToken: string;
  signatureEnabled: boolean;
}

const inputClass =
  "w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400";
const labelClass = "block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5";

export default function CanalesPage() {
  // Estado WhatsApp Cloud API
  const [waState, setWaState] = useState<WhatsAppState | null>(null);
  const [waForm, setWaForm] = useState({ wabaId: "", phoneNumberId: "", token: "", reminderTemplate: "", reminderTemplateLang: "es" });
  const [waSaving, setWaSaving] = useState(false);
  const [waDisconnecting, setWaDisconnecting] = useState(false);
  const [webhookWarning, setWebhookWarning] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Estado Webchat
  const [webActive, setWebActive] = useState(true);
  const [widgetColor, setWidgetColor] = useState("#0284c7");
  const [welcomeText, setWelcomeText] = useState("¡Hola! ¿Tienes dudas o quieres pedir cita? Escríbenos.");
  const [webSaving, setWebSaving] = useState(false);
  const [webSaved, setWebSaved] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const loadWhatsApp = async () => {
    try {
      const res = await fetch("/api/channels/whatsapp/status");
      if (!res.ok) return;
      const data: WhatsAppState = await res.json();
      setWaState(data);
      setWaForm({
        wabaId: data.wabaId,
        phoneNumberId: data.phoneNumberId,
        token: "",
        reminderTemplate: data.reminderTemplate,
        reminderTemplateLang: data.reminderTemplateLang || "es",
      });
    } catch {
      // Silencioso
    }
  };

  useEffect(() => {
    loadWhatsApp();
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

  const handleConnectWhatsApp = async () => {
    setWaSaving(true);
    setWebhookWarning(null);
    try {
      const res = await fetch("/api/channels/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("No se pudo conectar", data.error || "Revisa los datos de tu app de Meta.");
        return;
      }
      if (data.webhook && !data.webhook.ok) {
        setWebhookWarning(data.webhook.message);
        toast.warning("Número conectado", "Falta registrar el webhook en Meta. Revisa el aviso.");
      } else {
        toast.success("WhatsApp conectado", `Sintia ya atiende el número ${data.displayPhoneNumber}.`);
      }
      await loadWhatsApp();
    } catch (err) {
      console.error(err);
      toast.error("Error", "No se pudo contactar el servidor.");
    } finally {
      setWaSaving(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    const ok = await confirmDialog({
      title: "¿Desconectar WhatsApp?",
      description: "Se quitará el webhook del número y se borrará el token. El bot dejará de responder; las conversaciones se conservan.",
      confirmText: "Desconectar",
      destructive: true,
    });
    if (!ok) return;

    setWaDisconnecting(true);
    try {
      await fetch("/api/channels/whatsapp/disconnect", { method: "POST" });
      toast.info("WhatsApp desconectado", "El número ya no está vinculado a Sintia.");
      setWebhookWarning(null);
      await loadWhatsApp();
    } catch (err) {
      console.error(err);
      toast.error("Error", "No se pudo desconectar WhatsApp.");
    } finally {
      setWaDisconnecting(false);
    }
  };

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">WhatsApp Business</h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Conexión oficial mediante la WhatsApp Cloud API de Meta.
                </div>
              </div>
            </div>

            <div>
              {waState?.status === "connected" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Desconectado
                </span>
              )}
            </div>
          </div>

          {/* Número conectado */}
          {waState?.status === "connected" && (
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
                  El asistente recibe los mensajes por webhook, agrupa las ráfagas del cliente y responde por la API oficial.
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
          )}

          {/* Pasos para conectar */}
          {waState?.status !== "connected" && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-200">Pasos para conectar:</div>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <li>En <strong>developers.facebook.com</strong> crea una app de tipo <strong>Empresa</strong> y añade el producto <strong>WhatsApp</strong>.</li>
                <li>En <strong>WhatsApp &gt; Configuración de la API</strong> copia el <strong>Phone Number ID</strong> y el <strong>WABA ID</strong>.</li>
                <li>En <strong>Business Manager &gt; Usuarios del sistema</strong> genera un token permanente con los permisos <strong>whatsapp_business_messaging</strong> y <strong>whatsapp_business_management</strong>.</li>
                <li>Pega los datos aquí: Sintia valida el token y registra el webhook en tu número automáticamente.</li>
              </ol>
            </div>
          )}

          {/* Formulario de credenciales */}
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>WABA ID</label>
                <input
                  type="text"
                  value={waForm.wabaId}
                  onChange={(e) => setWaForm({ ...waForm, wabaId: e.target.value })}
                  placeholder="1234567890"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone Number ID</label>
                <input
                  type="text"
                  value={waForm.phoneNumberId}
                  onChange={(e) => setWaForm({ ...waForm, phoneNumberId: e.target.value })}
                  placeholder="1098765432"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Token de acceso permanente</label>
              <input
                type="password"
                autoComplete="off"
                value={waForm.token}
                onChange={(e) => setWaForm({ ...waForm, token: e.target.value })}
                placeholder={waState?.tokenMasked ? `Guardado: ${waState.tokenMasked} (vacío = conservarlo)` : "EAAG..."}
                className={inputClass}
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Se guarda cifrado con AES-256-GCM y nunca se devuelve completo al navegador.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Plantilla de recordatorio (opcional)</label>
                <input
                  type="text"
                  value={waForm.reminderTemplate}
                  onChange={(e) => setWaForm({ ...waForm, reminderTemplate: e.target.value })}
                  placeholder="recordatorio_cita"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Idioma</label>
                <input
                  type="text"
                  value={waForm.reminderTemplateLang}
                  onChange={(e) => setWaForm({ ...waForm, reminderTemplateLang: e.target.value })}
                  placeholder="es"
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 -mt-2">
              WhatsApp solo permite texto libre durante 24 h tras el último mensaje del cliente. Fuera de esa ventana, los recordatorios usan esta plantilla aprobada con las variables {"{{1}}"} nombre, {"{{2}}"} servicio y {"{{3}}"} hora.
            </p>

            {webhookWarning && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {webhookWarning} Puedes pegar la URL y el token de verificación de abajo en <strong>WhatsApp &gt; Configuración &gt; Webhook</strong> de tu app y suscribir el campo <strong>messages</strong>.
                </span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConnectWhatsApp}
                disabled={waSaving || !waForm.wabaId || !waForm.phoneNumberId || (!waForm.token && !waState?.tokenMasked)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{waSaving ? "Validando con Meta..." : waState?.status === "connected" ? "Guardar cambios" : "Conectar número"}</span>
              </button>
            </div>
          </div>

          {/* Webhook */}
          {waState && (
            <div className="space-y-3 text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <Link2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Webhook de Meta</span>
              </div>
              {[
                { key: "url", label: "URL de devolución de llamada", value: waState.webhookUrl },
                { key: "verify", label: "Token de verificación", value: waState.verifyToken },
              ].map((f) => (
                <div key={f.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{f.label}</label>
                    <button
                      type="button"
                      onClick={() => handleCopy(f.key, f.value)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition"
                    >
                      {copiedField === f.key ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === f.key ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900 dark:bg-black text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 break-all">
                    <code>{f.value}</code>
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Sintia lo registra sola al conectar. La URL debe ser pública con HTTPS (define <code className="font-mono text-slate-600 dark:text-slate-400">APP_URL</code>; en local usa un túnel como cloudflared o ngrok).
                {waState.signatureEnabled
                  ? " La firma de cada evento se verifica con META_APP_SECRET."
                  : " Define META_APP_SECRET para verificar la firma de cada evento."}
              </p>
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
