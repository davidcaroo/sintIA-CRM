"use client";

import React, { useEffect, useState } from "react";
import {
  Building,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  FileText,
  Clock,
  Tag,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number | null;
  isFromPrice: boolean;
  requiresValuation: boolean;
  stripeDeposit?: number | null;
}

interface Faq {
  id: string;
  question: string;
  answer: string;
}

interface BusinessInfo {
  name: string;
  activity: string;
  address: string;
  phone: string;
  website: string;
}

export default function ConocimientoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [business, setBusiness] = useState<BusinessInfo>({
    name: "",
    activity: "",
    address: "",
    phone: "",
    website: "",
  });
  const [services, setServices] = useState<Service[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [noteContent, setNoteContent] = useState("");

  // Modal Service
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

  // Modal FAQ
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Partial<Faq> | null>(null);

  // Modal Import Web
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("https://");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Record<number, boolean>>({});
  const [selectedFaqs, setSelectedFaqs] = useState<Record<number, boolean>>({});
  const [saveBusinessFromImport, setSaveBusinessFromImport] = useState(true);

  const loadData = () => {
    fetch("/api/knowledge")
      .then((res) => res.json())
      .then((data) => {
        if (data.business) setBusiness(data.business);
        if (data.services) setServices(data.services);
        if (data.faqs) setFaqs(data.faqs);
        if (data.noteContent !== undefined) setNoteContent(data.noteContent);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGeneral = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business, noteContent }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Guardar servicio
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.name) return;

    try {
      if (editingService.id) {
        await fetch(`/api/knowledge/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingService),
        });
      } else {
        await fetch("/api/knowledge/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingService),
        });
      }
      setShowServiceModal(false);
      setEditingService(null);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este servicio?")) return;
    try {
      await fetch(`/api/knowledge/services/${id}`, { method: "DELETE" });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Guardar FAQ
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq?.question || !editingFaq?.answer) return;

    try {
      if (editingFaq.id) {
        await fetch(`/api/knowledge/faqs/${editingFaq.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingFaq),
        });
      } else {
        await fetch("/api/knowledge/faqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingFaq),
        });
      }
      setShowFaqModal(false);
      setEditingFaq(null);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta pregunta frecuente?")) return;
    try {
      await fetch(`/api/knowledge/faqs/${id}`, { method: "DELETE" });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Importar desde web
  const handleStartImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const res = await fetch("/api/knowledge/import-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setImportError(data.error || "No se pudo procesar la web.");
      } else {
        setImportResult(data);
        const servs: Record<number, boolean> = {};
        data.proposal?.services?.forEach((_: any, idx: number) => {
          servs[idx] = true;
        });
        setSelectedServices(servs);

        const fqs: Record<number, boolean> = {};
        data.proposal?.faqs?.forEach((_: any, idx: number) => {
          fqs[idx] = true;
        });
        setSelectedFaqs(fqs);
      }
    } catch {
      setImportError("Error de red al intentar conectar con la web.");
    } finally {
      setImporting(false);
    }
  };

  const handleApplyImport = async () => {
    if (!importResult?.proposal) return;
    const { proposal } = importResult;

    if (saveBusinessFromImport && proposal.business) {
      await fetch("/api/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: {
            ...business,
            name: proposal.business.name || business.name,
            activity: proposal.business.activity || business.activity,
            address: proposal.business.address || business.address,
            phone: proposal.business.phone || business.phone,
            website: proposal.business.website || business.website,
          },
        }),
      });
    }

    if (proposal.services) {
      for (let i = 0; i < proposal.services.length; i++) {
        if (selectedServices[i]) {
          const s = proposal.services[i];
          await fetch("/api/knowledge/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(s),
          });
        }
      }
    }

    if (proposal.faqs) {
      for (let i = 0; i < proposal.faqs.length; i++) {
        if (selectedFaqs[i]) {
          const f = proposal.faqs[i];
          await fetch("/api/knowledge/faqs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(f),
          });
        }
      }
    }

    setShowImportModal(false);
    setImportResult(null);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400 dark:text-slate-500 text-sm">Cargando base de conocimiento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 transition-colors">
      {/* Barra de Acciones */}
      <div className="flex items-center justify-end gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowImportModal(true);
              setImportResult(null);
              setImportError(null);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 shadow-xs transition"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Importar desde una web</span>
          </button>
          <button
            onClick={handleSaveGeneral}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 disabled:opacity-60 transition"
          >
            {saving ? (
              <span>Guardando...</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardado</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar datos</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. Datos del Negocio */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5 transition-colors">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Datos Generales del Negocio</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Nombre del Negocio
            </label>
            <input
              type="text"
              value={business.name}
              onChange={(e) => setBusiness({ ...business, name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
              placeholder="Clínica Dental Lumen"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Teléfono de Contacto
            </label>
            <input
              type="text"
              value={business.phone}
              onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
              placeholder="+34 912 345 678"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Sitio Web
            </label>
            <input
              type="text"
              value={business.website}
              onChange={(e) => setBusiness({ ...business, website: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
              placeholder="https://clinicalumen.es"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              A qué se dedica (Actividad Principal)
            </label>
            <input
              type="text"
              value={business.activity}
              onChange={(e) => setBusiness({ ...business, activity: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
              placeholder="Clínica odontológica integral para toda la familia..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Dirección Física
            </label>
            <input
              type="text"
              value={business.address}
              onChange={(e) => setBusiness({ ...business, address: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
              placeholder="Calle Gran Vía 32, Madrid"
            />
          </div>
        </div>
      </div>

      {/* 2. Catálogo de Servicios */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Servicios y Tarifas ({services.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              El asistente usará estos datos exactos para informar y sugerir citas.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingService({
                name: "",
                description: "",
                durationMinutes: 30,
                price: 0,
                isFromPrice: false,
                requiresValuation: false,
              });
              setShowServiceModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Servicio</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition flex flex-col justify-between gap-3 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.name}</h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        setEditingService(s);
                        setShowServiceModal(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(s.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{s.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{s.durationMinutes} min</span>
                </div>

                <div className="flex items-center gap-2">
                  {s.requiresValuation && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 text-[10px] font-medium">
                      Valoración previa
                    </span>
                  )}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {s.price !== null ? (
                      <>
                        {s.isFromPrice && <span className="font-normal text-slate-400 dark:text-slate-500 text-[11px] mr-1">desde</span>}
                        {s.price === 0 ? "Gratis" : `$ ${s.price.toLocaleString("es-CO")} COP`}
                      </>
                    ) : (
                      "Consultar"
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Preguntas Frecuentes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Preguntas Frecuentes ({faqs.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Respuestas rápidas a dudas habituales sobre pagos, mutuas, ubicación o aparcamiento.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingFaq({ question: "", answer: "" });
              setShowFaqModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir FAQ</span>
          </button>
        </div>

        <div className="space-y-3">
          {faqs.map((f) => (
            <div
              key={f.id}
              className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{f.question}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{f.answer}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  <button
                    onClick={() => {
                      setEditingFaq(f);
                      setShowFaqModal(true);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(f.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Texto libre de conocimiento adicional */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Conocimiento Adicional (Texto Libre)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Cualquier otra información relevante que quieras que el asistente conozca (política de cancelaciones, protocolos internos, etc.).
        </p>
        <textarea
          rows={4}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
          placeholder="Escribe aquí cualquier dato adicional que deba conocer Sintia..."
        />
      </div>

      {/* MODAL SERVICIO */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingService?.id ? "Editar Servicio" : "Nuevo Servicio"}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Nombre del servicio
                </label>
                <input
                  type="text"
                  required
                  value={editingService?.name || ""}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                  placeholder="Limpieza dental con ultrasonidos"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={editingService?.description || ""}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                  placeholder="Detalles de lo que incluye el tratamiento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={5}
                    value={editingService?.durationMinutes || 30}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        durationMinutes: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Precio ($ COP)
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={editingService?.price ?? ""}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        price: e.target.value === "" ? null : parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                    placeholder="0 = Gratis"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService?.isFromPrice || false}
                    onChange={(e) =>
                      setEditingService({ ...editingService, isFromPrice: e.target.checked })
                    }
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Precio orientativo ("desde" este importe)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService?.requiresValuation || false}
                    onChange={(e) =>
                      setEditingService({ ...editingService, requiresValuation: e.target.checked })
                    }
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Requiere valoración previa obligatoria</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-sm"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FAQ */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingFaq?.id ? "Editar Pregunta" : "Nueva Pregunta Frecuente"}
              </h3>
              <button
                onClick={() => setShowFaqModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Pregunta
                </label>
                <input
                  type="text"
                  required
                  value={editingFaq?.question || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                  placeholder="¿Tienen opciones de financiación?"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Respuesta
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingFaq?.answer || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                  placeholder="Sí, disponemos de planes de pago de hasta..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFaqModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-sm"
                >
                  Guardar FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORTAR DESDE WEB */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Importar Conocimiento desde una Web</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Descarga la web, rastrea subpáginas de servicios y genera propuestas con IA.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              <form onSubmit={handleStartImport} className="flex gap-2">
                <input
                  type="url"
                  required
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://tudominio.es"
                  className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  disabled={importing}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition flex items-center gap-2 shadow-sm"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analizando web...</span>
                    </>
                  ) : (
                    <span>Escanear</span>
                  )}
                </button>
              </form>

              {importError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importResult?.proposal && (
                <div className="space-y-5 text-xs">
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <div>
                      <strong>¡Análisis completado!</strong> Se escanearon{" "}
                      {importResult.scrapedPagesCount} página(s). Selecciona los datos que deseas guardar:
                    </div>
                  </div>

                  {/* Datos del Negocio detectados */}
                  {importResult.proposal.business && (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2">
                      <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveBusinessFromImport}
                          onChange={(e) => setSaveBusinessFromImport(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <span>Actualizar datos del negocio</span>
                      </label>
                      <div className="text-slate-600 dark:text-slate-400 pl-6 space-y-0.5">
                        <div><strong>Nombre:</strong> {importResult.proposal.business.name}</div>
                        <div><strong>Actividad:</strong> {importResult.proposal.business.activity}</div>
                        <div><strong>Teléfono:</strong> {importResult.proposal.business.phone}</div>
                        <div><strong>Dirección:</strong> {importResult.proposal.business.address}</div>
                      </div>
                    </div>
                  )}

                  {/* Servicios detectados */}
                  {importResult.proposal.services?.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Servicios encontrados ({importResult.proposal.services.length}):
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {importResult.proposal.services.map((s: any, idx: number) => (
                          <label
                            key={idx}
                            className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={!!selectedServices[idx]}
                              onChange={(e) =>
                                setSelectedServices({ ...selectedServices, [idx]: e.target.checked })
                              }
                              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</div>
                              <div className="text-slate-500 dark:text-slate-400 text-[11px]">{s.description}</div>
                              <div className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                                {s.durationMinutes} min • {s.price ? `$ ${s.price.toLocaleString("es-CO")} COP` : "Consultar"}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAQs detectadas */}
                  {importResult.proposal.faqs?.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Preguntas Frecuentes detectadas ({importResult.proposal.faqs.length}):
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {importResult.proposal.faqs.map((f: any, idx: number) => (
                          <label
                            key={idx}
                            className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={!!selectedFaqs[idx]}
                              onChange={(e) =>
                                setSelectedFaqs({ ...selectedFaqs, [idx]: e.target.checked })
                              }
                              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">{f.question}</div>
                              <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{f.answer}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {importResult?.proposal && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Se guardarán los elementos seleccionados en la base de datos.
                </span>
                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                >
                  Guardar Selección en Sintia
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
