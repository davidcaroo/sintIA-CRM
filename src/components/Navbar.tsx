"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { ExternalLink, Sparkles } from "lucide-react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Resumen", subtitle: "Métricas y actividad en tiempo real" },
  "/comportamiento": { title: "Comportamiento", subtitle: "Personalidad, horarios y traspaso a humanos" },
  "/conocimiento": { title: "Conocimiento", subtitle: "Servicios, preguntas frecuentes y base de datos" },
  "/integraciones": { title: "Integraciones", subtitle: "Conexiones con Calendar, Gmail, Sheets, Stripe y más" },
  "/canales": { title: "Canales", subtitle: "WhatsApp y burbuja de chat para tu sitio web" },
  "/probar": { title: "Probar Asistente", subtitle: "Simulador con línea de tiempo de herramientas y modo seguro" },
  "/conversaciones": { title: "Conversaciones", subtitle: "Bandeja de chats, control manual y soporte en vivo" },
  "/actividad": { title: "Actividad", subtitle: "Registro histórico y auditoría de eventos del sistema" },
  "/ajustes": { title: "Ajustes", subtitle: "Modelo de IA, costes, marca blanca y configuración general" },
};

export function Navbar({ businessName = "Clínica Dental Lumen" }: { businessName?: string }) {
  const pathname = usePathname();
  const current = pageTitles[pathname] || { title: "Panel", subtitle: businessName };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="h-full px-4 sm:px-6 md:px-8 flex items-center justify-between gap-4">
        {/* Título de la sección / Breadcrumb */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              {current.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block mt-1">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Acciones del Navbar: Demo, Selector de Tema, Admin */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Enlace directo a demo */}
          <Link
            href="/demo"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir web de prueba del cliente"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Web Demo</span>
          </Link>

          {/* Selector de Modo Claro / Oscuro con iconos Sol y Luna */}
          <ThemeToggle />

          {/* Badge Administrador */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              AD
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                Admin
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 leading-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En línea
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
