"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Mail,
  Table,
  Slack,
  CreditCard,
  Webhook,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Settings,
  Send,
  X,
  ShieldCheck,
} from "lucide-react";

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  isConnected: boolean;
  status: "disconnected" | "connected" | "error";
  statusMessage: string | null;
  connectedAccount: string | null;
  isTestMode?: boolean;
  config: any;
}

export default function IntegracionesPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<any>({});
  const [modalInput, setModalInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);

  const loadIntegrations = () => {
    fetch("/api/integrations")
      .then((res) => res.json())
      .then((data) => {
        if (data.integrations) setIntegrations(data.integrations);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const openConfigModal = (it: IntegrationItem) => {
    setActiveModalId(it.id);
    setModalConfig(it.config || {});
    setModalInput("");
    setActionSuccess(null);
    setActionError(null);
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm(`¿Estás seguro de desconectar ${id}?`)) return;
    await fetch(`/api/integrations/${id}/disconnect`, { method: "POST" });
    loadIntegrations();
  };

  const handleGoogleConnect = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/integrations/google/auth-url?service=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: any) {
      alert(`Error al iniciar OAuth con Google: ${err.message}\nVerifica GOOGLE_CLIENT_ID en .env.`);
      setActionLoading(false);
    }
  };

  const handleSaveModalConfig = async () => {
    if (!activeModalId) return;
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      let endpoint = `/api/integrations/${activeModalId}/config`;
      let payload: any = { config: modalConfig };

      if (activeModalId === "slack" && modalInput) {
        payload.credentials = modalInput;
      }
      if (activeModalId === "webhooks") {
        payload.config = {
          ...modalConfig,
          destinationUrl: modalInput || modalConfig.destinationUrl,
        };
      }

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActionSuccess("¡Configuración guardada correctamente!");
      setTimeout(() => {
        setActiveModalId(null);
        loadIntegrations();
      }, 1000);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestSlack = async () => {
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await fetch("/api/integrations/slack/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: modalInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionSuccess("¡Mensaje de prueba enviado con éxito a Slack!");
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await fetch("/api/integrations/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: modalInput, config: modalConfig }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionSuccess(`¡Stripe conectado! (${data.isTestMode ? "Modo Prueba" : "Modo Producción"})`);
      setTimeout(() => {
        setActiveModalId(null);
        loadIntegrations();
      }, 1500);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await fetch("/api/integrations/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationUrl: modalConfig.destinationUrl || modalInput,
          secret: modalConfig.secret,
          events: modalConfig.enabledEvents,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionSuccess("¡Evento de prueba firmado con HMAC-SHA256 y enviado!");
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getIntegrationIcon = (id: string) => {
    switch (id) {
      case "google_calendar":
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
        );
      case "google_gmail":
        return (
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
            <Mail className="w-6 h-6" />
          </div>
        );
      case "google_sheets":
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Table className="w-6 h-6" />
          </div>
        );
      case "slack":
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Slack className="w-6 h-6" />
          </div>
        );
      case "stripe":
        return (
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Webhook className="w-6 h-6" />
          </div>
        );
    }
  };

  const activeIntegration = integrations.find((i) => i.id === activeModalId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400 dark:text-slate-500 text-sm">Cargando catálogo de integraciones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 transition-colors">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Catálogo de Integraciones</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Conecta las aplicaciones del negocio. Las herramientas del asistente se activan según las integraciones conectadas.
          </p>
        </div>
        <button
          onClick={() => setShowGoogleGuide(!showGoogleGuide)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 shadow-xs transition"
        >
          <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Guía Google Cloud OAuth</span>
        </button>
      </div>

      {/* Guía desplegable de Google Cloud Console */}
      {showGoogleGuide && (
        <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 space-y-3 text-xs text-indigo-950 dark:text-indigo-200 transition-colors">
          <div className="flex items-center justify-between font-bold text-sm text-indigo-900 dark:text-indigo-200">
            <span>Cómo configurar el cliente OAuth de Google Cloud para el negocio</span>
            <button onClick={() => setShowGoogleGuide(false)} className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
            <li>
              Entra en{" "}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold"
              >
                Google Cloud Console
              </a>{" "}
              y crea o selecciona el proyecto del negocio.
            </li>
            <li>
              Habilita las APIs: <strong>Google Calendar API</strong>, <strong>Gmail API</strong> y{" "}
              <strong>Google Sheets API</strong> en <em>APIs y servicios &gt; Biblioteca</em>.
            </li>
            <li>
              En <em>Pantalla de consentimiento OAuth</em>, configúrala como <strong>Externa</strong> y pulsa{" "}
              <strong>Publicar aplicación (En producción)</strong>. <em>(IMPORTANTE: En modo de prueba, Google caduca los tokens a los 7 días y el asistente se desconectaría solo)</em>.
            </li>
            <li>
              En <em>Credenciales &gt; Crear credenciales &gt; ID de cliente de OAuth</em>, selecciona{" "}
              <strong>Aplicación web</strong>.
            </li>
            <li>
              En <strong>URIs de redireccionamiento autorizados</strong>, añade:{" "}
              <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 font-mono text-[11px] text-indigo-700 dark:text-indigo-300">
                http://localhost:3000/api/integrations/google/callback
              </code>{" "}
              (y al desplegar en producción añadirás el dominio real).
            </li>
            <li>
              Copia el <strong>ID de cliente</strong> y <strong>Secreto</strong> en tu fichero <code className="bg-white dark:bg-slate-900 px-1 font-mono text-indigo-700 dark:text-indigo-300">.env</code>.
            </li>
          </ol>
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-850 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Aviso de «Aplicación no verificada»:</strong> Al conectar por primera vez, verás la pantalla de aviso de Google. Es completamente normal: solo debes pulsar en <em>«Configuración avanzada &gt; Ir a Sintia (no seguro)»</em>. Para eliminar el aviso de forma permanente, la agencia puede solicitar la verificación oficial aportando su política de privacidad.
            </span>
          </div>
        </div>
      )}

      {/* Grid de Tarjetas tipo App Store */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((it) => {
          const isGoogle = it.id.startsWith("google_");

          return (
            <div
              key={it.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  {getIntegrationIcon(it.id)}
                  <div>
                    {it.status === "connected" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Conectada</span>
                      </span>
                    ) : it.status === "error" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Error</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Sin conectar
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{it.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {it.id === "google_calendar" && "Gestión de agenda, consulta de huecos libres y reservas de citas automáticas."}
                    {it.id === "google_gmail" && "Envío de confirmaciones por correo a los clientes y resumen diario al dueño."}
                    {it.id === "google_sheets" && "Sincronización en vivo de clientes y citas en una hoja de cálculo propia."}
                    {it.id === "slack" && "Avisos al equipo cuando se pide cita o una conversación requiere atención humana."}
                    {it.id === "stripe" && "Cobro de señales por adelantado con enlaces seguros de pago en Stripe."}
                    {it.id === "webhooks" && "Dispara automatizaciones externas en n8n, Make o Zapier con eventos firmados."}
                  </p>
                </div>

                {it.statusMessage && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 truncate">
                    {it.statusMessage}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openConfigModal(it)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Configurar</span>
                </button>

                {it.isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnect(it.id)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  >
                    Desconectar
                  </button>
                ) : isGoogle ? (
                  <button
                    type="button"
                    onClick={() => handleGoogleConnect(it.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
                  >
                    Conectar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfigModal(it)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
                  >
                    Conectar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CONFIGURACIÓN Y PERMISOS DE INTEGRACIÓN */}
      {activeModalId && activeIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 space-y-5 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                {getIntegrationIcon(activeIntegration.id)}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{activeIntegration.name}</h3>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {activeIntegration.isConnected ? "Integración conectada" : "Configuración de acceso"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveModalId(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* CASO: GOOGLE CALENDAR */}
            {activeIntegration.id === "google_calendar" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Calendario de Google a utilizar
                  </label>
                  <input
                    type="text"
                    value={modalConfig.calendarId || "primary"}
                    onChange={(e) => setModalConfig({ ...modalConfig, calendarId: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                    placeholder="primary (Calendario principal)"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Usa 'primary' o el ID de un calendario compartido.</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Duración (min)</label>
                    <input
                      type="number"
                      value={modalConfig.defaultDuration || 30}
                      onChange={(e) => setModalConfig({ ...modalConfig, defaultDuration: parseInt(e.target.value, 10) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Margen (min)</label>
                    <input
                      type="number"
                      value={modalConfig.bufferMargin || 10}
                      onChange={(e) => setModalConfig({ ...modalConfig, bufferMargin: parseInt(e.target.value, 10) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Antelación (h)</label>
                    <input
                      type="number"
                      value={modalConfig.minNoticeHours || 2}
                      onChange={(e) => setModalConfig({ ...modalConfig, minNoticeHours: parseInt(e.target.value, 10) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Permisos del asistente:</div>
                  {[
                    "Consultar huecos libres en el horario",
                    "Crear citas automáticas (con confirmación previa)",
                    "Modificar o cancelar citas del cliente",
                  ].map((perm, idx) => (
                    <label key={idx} className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 w-4 h-4 cursor-pointer" />
                      <span>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* CASO: GMAIL */}
            {activeIntegration.id === "google_gmail" && (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  Solo pide permiso de envío de correos (<strong>gmail.send</strong>). No lee la bandeja de entrada ni accede a tus correos privados.
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 w-4 h-4 cursor-pointer" />
                    <span>Enviar confirmación de cita al email del paciente</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 w-4 h-4 cursor-pointer" />
                    <span>Enviar resumen diario de actividad al dueño de la clínica</span>
                  </label>
                </div>
              </div>
            )}

            {/* CASO: GOOGLE SHEETS */}
            {activeIntegration.id === "google_sheets" && (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                  Usa el permiso restringido <strong>drive.file</strong>. Solo puede leer y escribir la hoja que la propia aplicación crea.
                </div>
                {modalConfig.spreadsheetUrl ? (
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Hoja de cálculo enlazada</label>
                    <a
                      href={modalConfig.spreadsheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold underline"
                    >
                      <span>Abrir «Contactos — Clínica Dental Lumen» en Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">
                    Al pulsar «Conectar con Google», se creará automáticamente la hoja de contactos.
                  </p>
                )}
              </div>
            )}

            {/* CASO: SLACK */}
            {activeIntegration.id === "slack" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Incoming Webhook URL de Slack
                  </label>
                  <input
                    type="url"
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Pega la URL de webhook de tu canal de equipo.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleTestSlack}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar mensaje de prueba</span>
                  </button>
                </div>
              </div>
            )}

            {/* CASO: STRIPE */}
            {activeIntegration.id === "stripe" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Clave de API Restringida de Stripe
                  </label>
                  <input
                    type="password"
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    placeholder="rk_test_... o rk_live_..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Vale la clave de modo prueba. Debe tener permisos para crear Checkout Sessions.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Importe del anticipo / seña por defecto ($ COP)
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={modalConfig.defaultDeposit || 50000}
                    onChange={(e) => setModalConfig({ ...modalConfig, defaultDeposit: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConnectStripe}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 w-full shadow-sm"
                >
                  Verificar y Conectar Stripe
                </button>
              </div>
            )}

            {/* CASO: WEBHOOKS EXTERNOS */}
            {activeIntegration.id === "webhooks" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    URL de Destino (n8n, Make, Zapier)
                  </label>
                  <input
                    type="url"
                    value={modalConfig.destinationUrl || ""}
                    onChange={(e) => setModalConfig({ ...modalConfig, destinationUrl: e.target.value })}
                    placeholder="https://tu-n8n.com/webhook/..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Clave secreta para firma HMAC-SHA256
                  </label>
                  <input
                    type="text"
                    value={modalConfig.secret || "sintia_secret_webhook_key"}
                    onChange={(e) => setModalConfig({ ...modalConfig, secret: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Eventos a emitir:</div>
                  {[
                    ["conversation.created", "Conversación nueva iniciada"],
                    ["appointment.created", "Cita agendada por el asistente"],
                    ["conversation.handoff", "Pasa a una persona (Handoff)"],
                    ["contact.created", "Nuevo contacto capturado"],
                  ].map(([evId, evLabel]) => (
                    <label key={evId} className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={modalConfig.enabledEvents?.includes(evId) ?? true}
                        onChange={(e) => {
                          const current = modalConfig.enabledEvents || [
                            "conversation.created",
                            "appointment.created",
                            "conversation.handoff",
                            "contact.created",
                          ];
                          const updated = e.target.checked
                            ? [...current, evId]
                            : current.filter((x: string) => x !== evId);
                          setModalConfig({ ...modalConfig, enabledEvents: updated });
                        }}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      <span>{evLabel}</span>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar evento de prueba</span>
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModalId(null)}
                className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition"
              >
                Cerrar
              </button>
              {activeIntegration.id !== "stripe" && (
                <button
                  type="button"
                  onClick={handleSaveModalConfig}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold shadow-sm transition"
                >
                  Guardar Configuración
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
