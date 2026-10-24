"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

const ROTATING_WORDS = [
  "multicanal.",
  "que vende.",
  "que agenda citas.",
  "24/7 en tu negocio.",
  "con IA de última generación.",
  "sin tocar código.",
];

export function AnnouncementBanner() {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      // Inicia animación de salida
      setIsAnimating(true);

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        setIsAnimating(false);
      }, 350); // mitad de la transición para swap suave
    }, 3000); // Rota cada 3 segundos como en vocerocrm

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden bg-slate-950 text-slate-200 border-b border-indigo-900/30 text-xs py-2 px-4 select-none z-30 transition-colors">
      {/* Sutil resplandor de fondo */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-indigo-500/10 opacity-70 pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 relative z-10">
        {/* Lado izquierdo: El CRM [palabra rotativa] */}
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          {/* Badge pulsante */}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950/90 text-indigo-300 border border-indigo-800/60 font-mono text-[10px] uppercase font-bold tracking-wider shrink-0 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sintia OS
          </span>

          {/* Bloque con 'EL CRM' fijo y la palabra rotativa fluida */}
          <div className="flex items-center gap-1.5 font-medium text-slate-300 text-xs sm:text-sm">
            <span className="font-extrabold tracking-tight text-white uppercase text-xs sm:text-sm drop-shadow-xs">
              EL CRM
            </span>

            {/* Contenedor del texto rotativo con altura fija para evitar CLS */}
            <div className="h-5 overflow-hidden inline-flex items-center font-bold text-indigo-400 dark:text-indigo-300">
              <span
                key={index}
                className={`inline-block transform transition-all duration-350 ease-out will-change-transform ${
                  isAnimating
                    ? "-translate-y-4 opacity-0 filter blur-[2px]"
                    : "translate-y-0 opacity-100 filter blur-0"
                }`}
              >
                {ROTATING_WORDS[index]}
              </span>
            </div>
          </div>
        </div>

        {/* Lado derecho: Acceso rápido al panel */}
        <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-indigo-300 hover:text-white border border-white/10 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>Acceso al Panel</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
