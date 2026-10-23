"use client";

import React, { useEffect, useState } from "react";
import {
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface ActivityLogItem {
  id: string;
  action: string;
  integrationId: string | null;
  channel: string | null;
  details: string;
  status: "success" | "error" | "warning";
  error: string | null;
  metadata: any;
  createdAt: string;
}

export default function ActividadPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [integrationFilter, setIntegrationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedLog, setExpandedLog] = useState<Record<string, boolean>>({});

  const loadLogs = () => {
    setLoading(true);
    fetch(`/api/activity?integrationId=${integrationFilter}&status=${statusFilter}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.logs) setLogs(data.logs);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
  }, [integrationFilter, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Éxito
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Aviso
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
            <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
            Error
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 transition-colors">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Registro de Actividad</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Auditoría en tiempo real de cada llamada a herramientas, integraciones y acciones del asistente.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3 text-xs transition-colors">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
          <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Filtrar por:</span>
        </div>

        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <select
            value={integrationFilter}
            onChange={(e) => setIntegrationFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:ring-1 focus:ring-indigo-600 cursor-pointer"
          >
            <option value="all">Todas las integraciones</option>
            <option value="google_calendar">Google Calendar</option>
            <option value="google_gmail">Gmail</option>
            <option value="google_sheets">Google Sheets</option>
            <option value="slack">Slack</option>
            <option value="stripe">Stripe</option>
            <option value="webhooks">Webhooks</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:ring-1 focus:ring-indigo-600 cursor-pointer"
          >
            <option value="all">Todos los resultados</option>
            <option value="success">Solo Éxito</option>
            <option value="warning">Solo Advertencias</option>
            <option value="error">Solo Errores</option>
          </select>
        </div>

        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          Mostrando últimos {logs.length} eventos
        </span>
      </div>

      {/* Lista de Registros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500">Cargando registros...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500">No se encontraron registros de actividad.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => {
              const isExpanded = !!expandedLog[log.id];

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition text-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(log.status)}
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{log.action}</span>
                      {log.channel && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-semibold">
                          {log.channel}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.createdAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</span>
                    </div>
                  </div>

                  <div className="text-slate-700 dark:text-slate-300 pl-1 font-medium">{log.details}</div>

                  {log.error && (
                    <div className="text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900 text-[11px] font-mono whitespace-pre-wrap">
                      {log.error}
                    </div>
                  )}

                  {log.metadata && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setExpandedLog({ ...expandedLog, [log.id]: !isExpanded })}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <span>{isExpanded ? "Ocultar payload" : "Ver payload JSON"}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 bg-slate-900 dark:bg-black text-slate-200 rounded-xl font-mono text-[10px] overflow-x-auto border border-slate-800">
                          <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
