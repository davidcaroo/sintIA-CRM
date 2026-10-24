"use client";

import React, { useEffect, useState } from "react";
import {
  Bot,
  Sparkles,
  Save,
  Eye,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  X,
} from "lucide-react";

const dayLabels: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

export default function ComportamientoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [fullPrompt, setFullPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: "Sintia",
    tone: "cercano",
    welcomeMessage: "",
    customInstructions: "",
    neverDoRules: "",
    afterHoursBehavior: "appointment",
    handoffOnComplaint: true,
    handoffOnUrgency: true,
    handoffOnRequest: true,
    handoffOnUnknown: true,
    handoffCustomRule: "",
    businessHours: {
      monday: { active: true, morningOpen: "09:00", morningClose: "14:00", afternoonOpen: "16:00", afternoonClose: "20:00" },
      tuesday: { active: true, morningOpen: "09:00", morningClose: "14:00", afternoonOpen: "16:00", afternoonClose: "20:00" },
      wednesday: { active: true, morningOpen: "09:00", morningClose: "14:00", afternoonOpen: "16:00", afternoonClose: "20:00" },
      thursday: { active: true, morningOpen: "09:00", morningClose: "14:00", afternoonOpen: "16:00", afternoonClose: "20:00" },
      friday: { active: true, morningOpen: "09:00", morningClose: "14:00", afternoonOpen: "16:00", afternoonClose: "20:00" },
      saturday: { active: false, morningOpen: "10:00", morningClose: "14:00", afternoonOpen: "", afternoonClose: "" },
      sunday: { active: false, morningOpen: "", morningClose: "", afternoonOpen: "", afternoonClose: "" },
    },
  });

  useEffect(() => {
    fetch("/api/behavior")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setFormData((prev) => ({
            ...prev,
            name: data.name || prev.name,
            tone: data.tone || prev.tone,
            welcomeMessage: data.welcomeMessage || prev.welcomeMessage,
            customInstructions: data.customInstructions || prev.customInstructions,
            neverDoRules: data.neverDoRules || prev.neverDoRules,
            afterHoursBehavior: data.afterHoursBehavior || prev.afterHoursBehavior,
            handoffOnComplaint: data.handoffOnComplaint ?? prev.handoffOnComplaint,
            handoffOnUrgency: data.handoffOnUrgency ?? prev.handoffOnUrgency,
            handoffOnRequest: data.handoffOnRequest ?? prev.handoffOnRequest,
            handoffOnUnknown: data.handoffOnUnknown ?? prev.handoffOnUnknown,
            handoffCustomRule: data.handoffCustomRule || prev.handoffCustomRule,
            businessHours: (data.businessHours as any) || prev.businessHours,
          }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch("/api/behavior", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err) {
      console.error("Error al guardar:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPromptModal = async () => {
    setShowPromptModal(true);
    try {
      const res = await fetch("/api/behavior/prompt-preview");
      const data = await res.json();
      setFullPrompt(data.prompt || "No se pudo cargar el prompt.");
    } catch {
      setFullPrompt("Error de conexión al cargar la vista previa del prompt.");
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400 dark:text-slate-500 text-sm">Cargando configuración de comportamiento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 transition-colors">
      {/* Barra de Acciones */}
      <div className="flex items-center justify-end gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenPromptModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition"
          >
            <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Ver el prompt completo</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 disabled:opacity-60 transition"
          >
            {saving ? (
              <span>Guardando...</span>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardado</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda / Central: Ajustes principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta Identidad y Tono */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6 transition-colors">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Identidad y Tono</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Nombre del Asistente
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                  placeholder="Sintia"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Tono de Comunicación
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "cercano", label: "Cercano", sub: "Cálido y empático" },
                    { id: "profesional", label: "Profesional", sub: "Formal y técnico" },
                    { id: "directo", label: "Directo", sub: "Ágil y conciso" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, tone: t.id })}
                      className={`p-2.5 rounded-xl text-left border text-xs transition ${
                        formData.tone === t.id
                          ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 font-semibold ring-1 ring-indigo-600 dark:ring-indigo-500"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100">{t.label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Mensaje de Bienvenida Inicial
              </label>
              <textarea
                rows={2}
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                placeholder="¡Hola! Soy Sintia, asistente de..."
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Se enviará en el primer mensaje de la conversación para presentarse amablemente.
              </p>
            </div>
          </div>

          {/* Tarjeta Instrucciones y Límites */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6 transition-colors">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Instrucciones y Límites</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Instrucciones Adicionales (Texto Libre)
              </label>
              <textarea
                rows={3}
                value={formData.customInstructions}
                onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                placeholder="Instrucciones sobre prioridades, promociones del mes o detalles clave..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span>Cosas que NUNCA debe hacer</span>
              </label>
              <textarea
                rows={3}
                value={formData.neverDoRules}
                onChange={(e) => setFormData({ ...formData, neverDoRules: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-slate-200"
                placeholder="- Nunca inventar precios que no existan&#10;- Nunca dar consejos médicos o diagnósticos..."
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Líneas de seguridad inviolables. El modelo las priorizará sobre cualquier otra orden.
              </p>
            </div>
          </div>

          {/* Tarjeta Horario de Atención */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6 transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Horario de Atención por Días</span>
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-500">Zona America/Bogota</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {Object.entries(formData.businessHours).map(([dayKey, dayData]: [string, any]) => (
                <div key={dayKey} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 w-32">
                    <input
                      type="checkbox"
                      id={`day-${dayKey}`}
                      checked={dayData.active}
                      onChange={(e) => {
                        const newHours = { ...formData.businessHours };
                        (newHours as any)[dayKey].active = e.target.checked;
                        setFormData({ ...formData, businessHours: newHours });
                      }}
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor={`day-${dayKey}`} className="text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                      {dayLabels[dayKey]}
                    </label>
                  </div>

                  {dayData.active ? (
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 dark:text-slate-500">Mañana:</span>
                        <input
                          type="time"
                          value={dayData.morningOpen || ""}
                          onChange={(e) => {
                            const newHours = { ...formData.businessHours };
                            (newHours as any)[dayKey].morningOpen = e.target.value;
                            setFormData({ ...formData, businessHours: newHours });
                          }}
                          className="bg-transparent border-0 p-0 text-slate-700 dark:text-slate-200 font-medium focus:ring-0 text-xs"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={dayData.morningClose || ""}
                          onChange={(e) => {
                            const newHours = { ...formData.businessHours };
                            (newHours as any)[dayKey].morningClose = e.target.value;
                            setFormData({ ...formData, businessHours: newHours });
                          }}
                          className="bg-transparent border-0 p-0 text-slate-700 dark:text-slate-200 font-medium focus:ring-0 text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 dark:text-slate-500">Tarde:</span>
                        <input
                          type="time"
                          value={dayData.afternoonOpen || ""}
                          onChange={(e) => {
                            const newHours = { ...formData.businessHours };
                            (newHours as any)[dayKey].afternoonOpen = e.target.value;
                            setFormData({ ...formData, businessHours: newHours });
                          }}
                          className="bg-transparent border-0 p-0 text-slate-700 dark:text-slate-200 font-medium focus:ring-0 text-xs"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={dayData.afternoonClose || ""}
                          onChange={(e) => {
                            const newHours = { ...formData.businessHours };
                            (newHours as any)[dayKey].afternoonClose = e.target.value;
                            setFormData({ ...formData, businessHours: newHours });
                          }}
                          className="bg-transparent border-0 p-0 text-slate-700 dark:text-slate-200 font-medium focus:ring-0 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">Cerrado</span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                ¿Qué contesta fuera de horario?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, afterHoursBehavior: "appointment" })}
                  className={`p-3 rounded-xl text-left border text-xs transition ${
                    formData.afterHoursBehavior === "appointment"
                      ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 font-semibold ring-1 ring-indigo-600 dark:ring-indigo-500"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Seguir atendiendo y dar cita</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Responde preguntas y busca hueco libre para los próximos días laborables.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, afterHoursBehavior: "take_message" })}
                  className={`p-3 rounded-xl text-left border text-xs transition ${
                    formData.afterHoursBehavior === "take_message"
                      ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 font-semibold ring-1 ring-indigo-600 dark:ring-indigo-500"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Solo tomar el recado</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Avisa de que está cerrado y recoge la consulta para que el equipo responda al abrir.
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Reglas de derivación (Handoff) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5 transition-colors">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Cuándo Pasar a una Persona</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              El asistente silenciará sus respuestas y alertará al equipo si detecta alguna de estas situaciones:
            </p>

            <div className="space-y-3">
              {[
                {
                  key: "handoffOnComplaint",
                  label: "Queja o insatisfacción",
                  desc: "Si el cliente manifiesta enfado o protesta.",
                },
                {
                  key: "handoffOnUrgency",
                  label: "Urgencia o dolor severo",
                  desc: "Síntomas clínicos agudos o situaciones graves.",
                },
                {
                  key: "handoffOnRequest",
                  label: "Pide hablar con alguien",
                  desc: "Solicita expresamente atención de un humano.",
                },
                {
                  key: "handoffOnUnknown",
                  label: "No sabe la respuesta",
                  desc: "Si el dato no está en el catálogo ni en FAQs.",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(formData as any)[item.key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [item.key]: e.target.checked })
                    }
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Regla libre adicional de derivación
              </label>
              <textarea
                rows={3}
                value={formData.handoffCustomRule}
                onChange={(e) => setFormData({ ...formData, handoffCustomRule: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                placeholder="Ejemplo: Si preguntan por presupuestos de ortodoncia de más de 3.000 € o solicitan hablar con la directora médica..."
              />
            </div>
          </div>

          <div className="bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-5 space-y-3 transition-colors">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-semibold text-xs">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Transparencia y Control</span>
            </div>
            <p className="text-xs text-indigo-950/80 dark:text-indigo-200/80 leading-relaxed">
              En cualquier momento puedes pulsar <strong>«Ver el prompt completo»</strong> para inspeccionar exactamente las instrucciones que lee el modelo de IA antes de cada respuesta.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Ver el prompt completo (solo lectura) */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Prompt del Sistema en Tiempo Real</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Texto exacto y de solo lectura que recibe el modelo en cada invocación.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copiado" : "Copiar"}</span>
                </button>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 flex-1 overflow-y-auto bg-slate-900 dark:bg-black text-slate-100 text-xs font-mono rounded-b-2xl whitespace-pre-wrap leading-relaxed select-text border-t border-slate-800">
              {fullPrompt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
