"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, ChevronDown, Check } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={menuRef}>
      {/* Botón rápido de alternar (Sol / Luna) con clic principal */}
      <div className="flex items-center rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs transition-colors">
        <button
          type="button"
          onClick={toggleTheme}
          title={`Cambiar a modo ${resolvedTheme === "dark" ? "claro" : "oscuro"}`}
          aria-label={`Cambiar a modo ${resolvedTheme === "dark" ? "claro" : "oscuro"}`}
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all focus:outline-hidden"
        >
          <div className="relative w-4 h-4 flex items-center justify-center">
            {resolvedTheme === "dark" ? (
              <Moon className="w-4 h-4 text-indigo-400 transition-transform duration-300 rotate-0 scale-100" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 rotate-0 scale-100" />
            )}
          </div>
          <span className="hidden sm:inline font-medium">
            {theme === "system" ? "Auto" : resolvedTheme === "dark" ? "Oscuro" : "Claro"}
          </span>
        </button>

        {/* Desplegable para seleccionar Claro / Oscuro / Sistema */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          title="Opciones de apariencia"
          aria-label="Abrir selector de tema"
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Menú flotante */}
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-900/10 dark:shadow-black/40 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              setTheme("light");
              setMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition ${
              theme === "light"
                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Claro
            </span>
            {theme === "light" && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("dark");
              setMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition ${
              theme === "dark"
                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Oscuro
            </span>
            {theme === "dark" && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("system");
              setMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition ${
              theme === "system"
                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              Sistema
            </span>
            {theme === "system" && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
