"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Trash2, ShieldCheck, Mail, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function EliminacionDatosPage() {
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Barra de navegación */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la landing</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">Sintia</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold">
            <Trash2 className="w-3.5 h-3.5" />
            <span>User Data Deletion Callback & Instructions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Instrucciones para la Eliminación de Datos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            En cumplimiento con las políticas de plataformas de Meta (WhatsApp Business), Google y la Ley 1581 de 2012 de Colombia.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Información y Pasos */}
          <div className="lg:col-span-7 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Tu derecho a la supresión de datos personales
              </h2>
              <p>
                En <strong>Sintia</strong> valoramos profundamente la privacidad y el control de tus datos. Si has
                interactuado con nuestro asistente de IA a través de WhatsApp o el chat web, puedes solicitar la
                eliminación completa y definitiva de tu registro en cualquier momento.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ¿Qué datos se eliminan con tu solicitud?
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400 text-xs">
                <li>Número de teléfono y JID asociado en el registro de WhatsApp.</li>
                <li>Nombre, correo electrónico y datos de contacto almacenados en la base de datos.</li>
                <li>Historial íntegro de conversaciones, mensajes y herramientas invocadas por la IA.</li>
                <li>Cualquier metadato técnico o registro temporal de sesión en el navegador.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Plazo y confirmación del borrado
              </h2>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-4 h-4" />
                  <span>Plazo máximo de respuesta: 48 horas hábiles</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Una vez confirmada tu solicitud mediante el formulario o vía correo electrónico, se ejecuta el borrado
                  permanente en nuestra base de datos PostgreSQL y se genera una confirmación por escrito.
                </p>
              </div>
            </section>
          </div>

          {/* Columna Derecha: Formulario Directo de Solicitud */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Solicitud de Supresión</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ingresa el número o correo con el que conversaste con el asistente.
              </p>
            </div>

            {submitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-2 text-xs text-center animate-fade-in">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400" />
                <div className="font-bold text-sm">¡Solicitud recibida con éxito!</div>
                <p className="text-[11px] leading-relaxed">
                  Hemos generado el ticket de supresión para <strong>{phoneOrEmail}</strong>. En un plazo menor a 48
                  horas hábiles se completará el borrado de registros.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setPhoneOrEmail("");
                    setDetails("");
                  }}
                  className="mt-3 text-indigo-600 dark:text-indigo-400 font-semibold underline text-xs"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Teléfono WhatsApp o Correo *
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    placeholder="Ej: +57 300 123 4567 o usuario@gmail.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Detalles adicionales (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Indica si deseas eliminar una cita o conversación puntual..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
                >
                  {loading ? "Procesando..." : "Confirmar solicitud de borrado"}
                </button>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                  También puedes escribirnos a{" "}
                  <a href="mailto:privacidad@sintia.local" className="underline font-medium text-slate-600 dark:text-slate-400">
                    privacidad@sintia.local
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Sintia. Todos los derechos reservados.</div>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="hover:text-indigo-600 dark:hover:text-indigo-400">Landing</Link>
            <Link href="/privacidad" className="hover:text-indigo-600 dark:hover:text-indigo-400">Aviso de privacidad</Link>
            <Link href="/terminos" className="hover:text-indigo-600 dark:hover:text-indigo-400">Condiciones del servicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
