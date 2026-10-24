"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Power,
  Radio,
  Boxes,
  Calendar,
  MessageSquare,
  UserCheck,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function ResumenPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [toggling, setToggling] = useState(false);

  const loadData = () => {
    fetch("/api/summary")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleActive = async () => {
    if (!data) return;
    setToggling(true);
    const newState = !data.isActive;
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newState }),
      });
      if (res.ok) {
        setData({ ...data, isActive: newState });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-400 dark:text-slate-500 text-sm">Cargando panel de control...</div>
      </div>
    );
  }

  const { isActive, stats, channels, integrations, recentConversations } = data;
  const whatsappChannel = channels.find((c: any) => c.id === "whatsapp");
  const webChannel = channels.find((c: any) => c.id === "webchat");

  return (
    <div className="space-y-8 pb-16 transition-colors">
      {/* 1. Barra Superior con Interruptor Maestro */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
              isActive
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-50/50 dark:ring-emerald-900/20"
                : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 ring-4 ring-amber-50/50 dark:ring-amber-900/20"
            }`}
          >
            <Power className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Asistente {isActive ? "Encendido y Atendiendo" : "en Pausa"}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isActive
                    ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                    : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                }`}
              >
                {isActive ? "En Línea" : "Pausado"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isActive
                ? "Responde automáticamente mensajes de clientes por WhatsApp y el chat web."
                : "Las respuestas automáticas están temporalmente detenidas en todos los canales."}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleActive}
          disabled={toggling}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-xs ${
            isActive
              ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-800 dark:hover:text-amber-300 hover:border-amber-200 dark:hover:border-amber-800 border border-slate-200 dark:border-slate-700"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isActive ? "Pausar Asistente" : "Reanudar Asistente"}</span>
        </button>
      </div>

      {/* 2. Tarjetas de Canales e Integraciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Canales */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Canales de Entrada</span>
            </h2>
            <Link
              href="/canales"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center gap-1"
            >
              Configurar <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    whatsappChannel?.status === "connected" ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">WhatsApp (Cloud API)</span>
              </div>
              <span className="text-slate-500 dark:text-slate-400">
                {whatsappChannel?.status === "connected"
                  ? whatsappChannel.connectedNumber || "Conectado"
                  : "Desconectado (Esperando QR)"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    webChannel?.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Chat Web Flotante</span>
              </div>
              <span className="text-slate-500 dark:text-slate-400">
                {webChannel?.isActive ? "Activo (/demo)" : "Desactivado"}
              </span>
            </div>
          </div>
        </div>

        {/* Integraciones Conectadas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Integraciones ({integrations.filter((i: any) => i.isConnected).length}/6)</span>
            </h2>
            <Link
              href="/integraciones"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center gap-1"
            >
              Catálogo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {integrations.map((it: any) => (
              <div
                key={it.id}
                className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs flex flex-col justify-between"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{it.name}</div>
                <div className="text-[10px] mt-1">
                  {it.isConnected ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">Conectada</span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">Sin conectar</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Métricas y KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-1 transition-colors">
          <div className="text-slate-400 dark:text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Conversaciones Hoy</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.conversationsToday}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            Total histórico: {stats.conversationsTotal}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-1 transition-colors">
          <div className="text-slate-400 dark:text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Citas Agendadas</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.appointmentsCreated}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">Creadas por Sintia</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-1 transition-colors">
          <div className="text-slate-400 dark:text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Esperan a Persona</span>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingHandoff}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">Necesitan atención del equipo</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-1 transition-colors">
          <div className="text-slate-400 dark:text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Tiempo Medio</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.avgResponseTime}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">Velocidad de respuesta IA</div>
        </div>
      </div>

      {/* 4. Conversaciones Recientes de Demostración */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Últimas Conversaciones</span>
          </h2>
          <Link
            href="/conversaciones"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center gap-1"
          >
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentConversations.map((c: any) => {
            const lastMsg = c.messages?.[0];
            const isHandoff = c.status === "human_handoff";

            return (
              <Link
                key={c.id}
                href="/conversaciones"
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-2 rounded-xl transition text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center uppercase">
                    {(c.contact?.name || "C").slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {c.contact?.name || "Cliente sin nombre"}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                        ({c.channel === "whatsapp" ? "WhatsApp" : "Web"})
                      </span>
                      {isHandoff && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-900/40 text-[10px] font-bold">
                          Atención Requerida
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-md mt-0.5">
                      {lastMsg ? lastMsg.text : "Sin mensajes aún"}
                    </div>
                  </div>
                </div>

                <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                  {new Date(c.lastMessageAt).toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Bogota",
                  })}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
