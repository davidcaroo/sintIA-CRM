"use client";

import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

type ConfirmListener = (options: ConfirmOptions) => Promise<boolean>;
let globalConfirmListener: ConfirmListener | null = null;

export const confirmDialog = (options: ConfirmOptions): Promise<boolean> => {
  if (globalConfirmListener) {
    return globalConfirmListener(options);
  }
  // Fallback seguro si aún no ha montado
  return Promise.resolve(window.confirm(`${options.title}\n${options.description}`));
};

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const showConfirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolveRef(() => resolve);
      setIsOpen(true);
    });
  }, []);

  useEffect(() => {
    globalConfirmListener = showConfirm;
    return () => {
      globalConfirmListener = null;
    };
  }, [showConfirm]);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef?.(false);
  };

  return (
    <>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay desenfocado estilo Shadcn */}
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={handleCancel}
          />

          {/* Tarjeta Modal Centrada */}
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xl z-10 transition-all transform animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  options.destructive
                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60"
                    : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {options.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {options.description}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                aria-label="Cerrar modal"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
              >
                {options.cancelText || "Cancelar"}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition ${
                  options.destructive
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                }`}
              >
                {options.confirmText || "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
