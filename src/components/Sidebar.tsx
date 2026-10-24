"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  Boxes,
  Radio,
  PlayCircle,
  MessageSquare,
  Activity,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  Building2,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface SidebarProps {
  businessName?: string;
  agencyName?: string;
}

const navItems = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/conversaciones", label: "Conversaciones", icon: MessageSquare },
  { href: "/comportamiento", label: "Comportamiento", icon: Bot },
  { href: "/conocimiento", label: "Conocimiento", icon: BookOpen },
  { href: "/integraciones", label: "Integraciones", icon: Boxes },
  { href: "/canales", label: "Canales", icon: Radio },
  { href: "/probar", label: "Probar", icon: PlayCircle },
  { href: "/actividad", label: "Actividad", icon: Activity },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export function Sidebar({ businessName = "Clínica Dental Lumen", agencyName = "Agencia IA" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Error al salir:", err);
    }
  };

  return (
    <>
      {/* Barra superior en Móvil */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-40 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">Sintia</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{businessName}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Tema en móvil */}
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menú"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Desktop y Drawer Móvil */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:h-full lg:shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Cabecera Sidebar con Marca */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Sintia
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                <Building2 className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="truncate">{businessName}</span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Instalado por</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{agencyName}</span>
          </div>
        </div>

        {/* Lista de Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                scroll={false}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs border border-indigo-100/60 dark:border-indigo-800/40"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Pie de Sidebar con Usuario y Salir */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center shrink-0">
                AD
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Administrador</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">America/Bogota</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
