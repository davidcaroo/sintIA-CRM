"use client";

import React, { useState, useEffect } from "react";

const ROTATING_PHRASES = [
  "multicanal.",
  "que vende.",
  "que agenda citas.",
  "24/7 en tu negocio.",
  "con IA de última generación.",
  "sin tocar código.",
];

export function AnnouncementBanner() {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_PHRASES.length);
        setIsTransitioning(false);
      }, 400); // Duración de salida para entrada suave de cristal
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden bg-slate-950/85 backdrop-blur-xl border-b border-white/[0.08] text-xs py-2 px-4 select-none z-30 transition-colors">
      {/* Resplandor ambiental de fondo (glow dinámico sutil) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-12 bg-gradient-to-r from-indigo-500/20 via-sky-400/20 to-purple-500/20 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Contenedor centralizado con cápsula glassmórfica */}
      <div className="max-w-7xl mx-auto flex items-center justify-center relative z-10">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md border border-white/[0.12] shadow-[0_0_20px_-3px_rgba(99,102,241,0.25)] transition-all duration-300">
          {/* Palabra fija: EL CRM */}
          <span className="font-black tracking-wider uppercase text-xs sm:text-sm text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            EL CRM
          </span>

          {/* Separador de cristal sutil */}
          <span className="text-white/20 font-light text-xs sm:text-sm select-none">|</span>

          {/* Frase rotativa con transición glassmórfica (desvanecimiento con desenfoque óptico y brillo) */}
          <div className="h-6 overflow-hidden inline-flex items-center justify-start min-w-[170px] sm:min-w-[210px]">
            <span
              key={index}
              className={`inline-block font-semibold text-xs sm:text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-200 to-indigo-200 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity,filter] ${
                isTransitioning
                  ? "-translate-y-3.5 opacity-0 scale-95 blur-[6px]"
                  : "translate-y-0 opacity-100 scale-100 blur-0"
              }`}
            >
              {ROTATING_PHRASES[index]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
