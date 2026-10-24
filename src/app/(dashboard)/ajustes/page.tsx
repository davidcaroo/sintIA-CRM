"use client";

import React, { useEffect, useState, useMemo } from "react";
import { toast } from "@/components/ui/Toast";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Cpu,
  Calculator,
  Key,
  ShieldCheck,
  RefreshCw,
  Search,
  Building,
  Users,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  promptPricePerMillion: number;
  completionPricePerMillion: number;
  isFree: boolean;
}

interface KeyStatus {
  configured: boolean;
  balance: number | null;
  usage: number | null;
  limit: number | null;
  label: string | null;
}

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AjustesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Ajustes generales y marca
  const [agencyName, setAgencyName] = useState("Agencia IA");
  const [agencyLogoUrl, setAgencyLogoUrl] = useState("");
  const [timezone, setTimezone] = useState("America/Bogota");
  const [selectedModel, setSelectedModel] = useState("anthropic/claude-haiku-5.5");

  // OpenRouter Modelos y Key
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [modelSearch, setModelSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "price">("price");

  // Calculadora de Costes
  const [monthlyConversations, setMonthlyConversations] = useState(1000);
  const [inputTokensPerConv, setInputTokensPerConv] = useState(20000);
  const [outputTokensPerConv, setOutputTokensPerConv] = useState(2000);

  // Usuarios del equipo
  const [users, setUsers] = useState<UserItem[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("member");
  const [showAddUser, setShowAddUser] = useState(false);

  // Cargar datos iniciales
  const loadInitialData = async () => {
    try {
      const [genRes, keyRes, usersRes] = await Promise.all([
        fetch("/api/settings/general"),
        fetch("/api/settings/key-status"),
        fetch("/api/settings/users"),
      ]);

      const genData = await genRes.json();
      if (genData.agencyName) setAgencyName(genData.agencyName);
      if (genData.agencyLogoUrl) setAgencyLogoUrl(genData.agencyLogoUrl);
      if (genData.timezone) setTimezone(genData.timezone);
      if (genData.model) setSelectedModel(genData.model);

      const keyData = await keyRes.json();
      setKeyStatus(keyData);

      const uData = await usersRes.json();
      if (uData.users) setUsers(uData.users);
    } catch (err) {
      console.error("Error al cargar ajustes:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async (forceRefresh = false) => {
    setLoadingModels(true);
    try {
      const res = await fetch(`/api/settings/models?refresh=${forceRefresh ? "true" : "false"}`);
      const data = await res.json();
      if (data.models) {
        setModels(data.models);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    loadModels(false);
  }, []);

  const handleSaveGeneral = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName,
          agencyLogoUrl,
          timezone,
          model: selectedModel,
        }),
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      if (res.ok) {
        setShowAddUser(false);
        setNewUserEmail("");
        setNewUserName("");
        setNewUserPassword("");
        const uRes = await fetch("/api/settings/users");
        const uData = await uRes.json();
        if (uData.users) setUsers(uData.users);
      }
    } catch (err) {
      console.error("Error creando usuario:", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const ok = await confirmDialog({
      title: "¿Eliminar usuario?",
      description: "¿Estás seguro de que deseas revocar el acceso a este usuario del panel?",
      confirmText: "Eliminar",
      destructive: true,
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/settings/users?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        const uRes = await fetch("/api/settings/users");
        const uData = await uRes.json();
        if (uData.users) setUsers(uData.users);
        toast.success("Usuario eliminado", "El acceso ha sido revocado.");
      } else {
        toast.error("Error", "No se pudo eliminar el usuario.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error de conexión", err.message);
    }
  };

  // Filtrado y ordenación de modelos
  const filteredModels = useMemo(() => {
    let list = [...models];

    if (providerFilter === "free") {
      list = list.filter((m) => m.isFree);
    } else if (providerFilter !== "all") {
      list = list.filter((m) => m.provider.toLowerCase().includes(providerFilter.toLowerCase()));
    }

    if (modelSearch.trim()) {
      const q = modelSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === "price") {
        return a.promptPricePerMillion - b.promptPricePerMillion;
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [models, providerFilter, modelSearch, sortBy]);

  // Modelo actualmente seleccionado
  const currentModelInfo = useMemo(() => {
    return (
      models.find((m) => m.id === selectedModel) || {
        id: selectedModel,
        name: selectedModel,
        provider: "anthropic",
        promptPricePerMillion: 0.8,
        completionPricePerMillion: 4.0,
        isFree: false,
        contextLength: 200000,
      }
    );
  }, [models, selectedModel]);

  // Cálculo de coste mensual estimado
  const monthlyCostEstimate = useMemo(() => {
    const totalInputTokens = monthlyConversations * inputTokensPerConv;
    const totalOutputTokens = monthlyConversations * outputTokensPerConv;

    const inputCost = (totalInputTokens / 1000000) * currentModelInfo.promptPricePerMillion;
    const outputCost = (totalOutputTokens / 1000000) * currentModelInfo.completionPricePerMillion;
    const total = inputCost + outputCost;

    return {
      inputCost: inputCost.toFixed(2),
      outputCost: outputCost.toFixed(2),
      total: total.toFixed(2),
    };
  }, [monthlyConversations, inputTokensPerConv, outputTokensPerConv, currentModelInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400 dark:text-slate-500 text-sm">Cargando configuración general...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 transition-colors">
      {/* Barra de Acciones */}
      <div className="flex items-center justify-end pb-3 border-b border-slate-200/80 dark:border-slate-800">
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
              <span>Guardar ajustes</span>
            </>
          )}
        </button>
      </div>

      {/* 1. SECCIÓN MODELO DE IA Y OPENROUTER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Modelo de Inteligencia Artificial</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Conectado con OpenRouter API. Solo muestra modelos compatibles con herramientas (tools).
              </p>
            </div>
          </div>

          <button
            onClick={() => loadModels(true)}
            disabled={loadingModels}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingModels ? "animate-spin" : ""}`} />
            <span>Actualizar catálogo</span>
          </button>
        </div>

        {/* Estado de la clave de OpenRouter */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Key className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Clave API de OpenRouter (OPENROUTER_API_KEY)
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                {keyStatus?.configured ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Configurada y protegida en el servidor (nunca llega al cliente)
                  </span>
                ) : (
                  <span className="text-amber-700 dark:text-amber-400 font-medium inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    No configurada en .env. Por favor, asigna OPENROUTER_API_KEY.
                  </span>
                )}
              </div>
            </div>
          </div>

          {keyStatus?.configured && keyStatus.balance !== null && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">
              Saldo disponible: <strong>${keyStatus.balance} USD</strong>
            </div>
          )}
        </div>

        {/* Filtros rápidos y buscador */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder="Buscar por nombre, proveedor (anthropic, google, openai)..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "all", label: "Todos" },
                { id: "free", label: "Gratis" },
                { id: "anthropic", label: "Anthropic" },
                { id: "google", label: "Google" },
                { id: "openai", label: "OpenAI" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProviderFilter(p.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    providerFilter === p.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-0 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
              >
                <option value="price">Ordenar por precio</option>
                <option value="name">Ordenar por nombre</option>
              </select>
            </div>
          </div>

          {/* Desplegable / Selector de modelo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Modelo en uso por el asistente
            </label>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              {filteredModels.map((m) => {
                const isSelected = selectedModel === m.id;
                const isRecommended = m.id === "anthropic/claude-haiku-5.5";

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition text-xs ${
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-950/60 border-l-4 border-l-indigo-600 dark:border-l-indigo-400 text-indigo-950 dark:text-indigo-200 font-medium"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{m.name}</span>
                        {isRecommended && (
                          <span className="px-2 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-[10px]">
                            Recomendado
                          </span>
                        )}
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">({m.id})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Proveedor: <span className="capitalize">{m.provider}</span> • Contexto:{" "}
                        {(m.contextLength / 1000).toFixed(0)}k tokens
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {m.isFree ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Gratis</span>
                      ) : (
                        <div className="text-[11px]">
                          <div>
                            Entrada: <strong>${m.promptPricePerMillion}</strong> / 1M
                          </div>
                          <div>
                            Salida: <strong>${m.completionPricePerMillion}</strong> / 1M
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Si una llamada falla porque el modelo elegido no responde, Sintia reintentará
              automáticamente con el modelo por defecto.
            </p>
          </div>
        </div>

        {/* CALCULADORA DE COSTES ESTIMADOS */}
        <div className="p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
              <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Estimador de Coste Mensual de IA</span>
            </div>
            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
              Basado en: <strong>{currentModelInfo.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Conversaciones / mes
              </label>
              <input
                type="number"
                min={100}
                step={100}
                value={monthlyConversations}
                onChange={(e) => setMonthlyConversations(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Tokens de entrada / conv.
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={inputTokensPerConv}
                onChange={(e) => setInputTokensPerConv(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Tokens de salida / conv.
              </label>
              <input
                type="number"
                min={500}
                step={500}
                value={outputTokensPerConv}
                onChange={(e) => setOutputTokensPerConv(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-indigo-100 dark:border-indigo-800/60 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Coste estimado para {monthlyConversations.toLocaleString()} conversaciones:
            </span>
            <div className="text-base font-bold text-indigo-900 dark:text-indigo-200">
              ${monthlyCostEstimate.total} USD / mes
              {currentModelInfo.isFree && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-normal ml-1.5">(Totalmente Gratis)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN MARCA Y ZONA HORARIA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5 transition-colors">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Marca de la Agencia e Internacionalización</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personaliza la marca que tus clientes ven en el menú lateral y en la pantalla de inicio de sesión.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Nombre de la Agencia
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
              placeholder="Agencia IA"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Zona Horaria
            </label>
            <input
              type="text"
              disabled
              value={timezone}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Configurada para <strong>America/Bogota</strong> (Cartagena de Indias, Bolívar, Colombia).
            </p>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN USUARIOS Y EQUIPO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Equipo y Accesos ({users.length})</h2>
          </div>
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir miembro</span>
          </button>
        </div>

        {showAddUser && (
          <form
            onSubmit={handleCreateUser}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3 text-xs"
          >
            <div className="font-semibold text-slate-900 dark:text-slate-100">Crear nuevo usuario</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="María Recepción"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="maria@lumen.es"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold"
              >
                Crear Usuario
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((u) => (
            <div key={u.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center uppercase">
                  {u.name.slice(0, 2)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</div>
                  <div className="text-slate-500 dark:text-slate-400">{u.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium capitalize">
                  {u.role === "admin" ? "Administrador" : "Miembro del equipo"}
                </span>
                {users.length > 1 && (
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
