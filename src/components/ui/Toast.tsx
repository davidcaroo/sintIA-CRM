"use client";

import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Listener global para permitir invocar toast(...) desde cualquier función o archivo
type ToastListener = (toast: Omit<ToastItem, "id">) => void;
let globalToastListener: ToastListener | null = null;

export const toast = {
  success: (title: string, description?: string, duration = 4500) => {
    globalToastListener?.({ type: "success", title, description, duration });
  },
  error: (title: string, description?: string, duration = 6000) => {
    globalToastListener?.({ type: "error", title, description, duration });
  },
  warning: (title: string, description?: string, duration = 5000) => {
    globalToastListener?.({ type: "warning", title, description, duration });
  },
  info: (title: string, description?: string, duration = 4500) => {
    globalToastListener?.({ type: "info", title, description, duration });
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toastData: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...toastData, id };
    setToasts((prev) => [...prev, newToast]);

    const timer = setTimeout(() => {
      removeToast(id);
    }, toastData.duration || 4500);

    return () => clearTimeout(timer);
  }, [removeToast]);

  useEffect(() => {
    globalToastListener = addToast;
    return () => {
      globalToastListener = null;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Contenedor flotante de notificaciones estilo Shadcn UI */}
      <aside
        aria-label="Notificaciones"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none sm:max-w-md"
      >
        {toasts.map((t) => {
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
                t.type === "success"
                  ? "bg-white/95 dark:bg-slate-900/95 border-emerald-200 dark:border-emerald-900/60 text-slate-900 dark:text-slate-100 shadow-emerald-500/5"
                  : t.type === "error"
                  ? "bg-white/95 dark:bg-slate-900/95 border-rose-200 dark:border-rose-900/60 text-slate-900 dark:text-slate-100 shadow-rose-500/5"
                  : t.type === "warning"
                  ? "bg-white/95 dark:bg-slate-900/95 border-amber-200 dark:border-amber-900/60 text-slate-900 dark:text-slate-100 shadow-amber-500/5"
                  : "bg-white/95 dark:bg-slate-900/95 border-indigo-200 dark:border-indigo-900/60 text-slate-900 dark:text-slate-100 shadow-indigo-500/5"
              }`}
            >
              {/* Icono con badge sutil */}
              <div className="shrink-0 mt-0.5">
                {t.type === "success" && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {t.type === "error" && (
                  <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
                {t.type === "warning" && (
                  <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                {t.type === "info" && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60">
                    <Info className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Contenido de Texto */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="text-xs font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-100">
                  {t.title}
                </div>
                {t.description && (
                  <div className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 whitespace-pre-line">
                    {t.description}
                  </div>
                )}
              </div>

              {/* Botón Cerrar */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Cerrar notificación"
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return toast;
  }
  return toast;
}
