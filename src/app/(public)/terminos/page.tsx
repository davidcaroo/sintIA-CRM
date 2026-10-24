import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Condiciones del Servicio — Sintia",
  description: "Términos y condiciones de uso de la plataforma de asistentes de IA Sintia.",
};

export default function TerminosPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Términos y Acuerdos Legales</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Condiciones del Servicio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Vigente desde: 23 de octubre de 2026 • Aplicable en Colombia y a nivel internacional
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed space-y-6 text-slate-700 dark:text-slate-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                1
              </span>
              Aceptación de las Condiciones
            </h2>
            <p>
              El acceso, instalación y utilización de la plataforma <strong>Sintia</strong> (en adelante, el "Servicio"), ya
              sea a través de su panel de administración, el conector de WhatsApp o el widget web, implica la aceptación
              plena y sin reservas de los presentes Términos y Condiciones. Si usted no está de acuerdo con alguna de
              estas disposiciones, debe abstenerse de utilizar el Servicio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                2
              </span>
              Descripción del Servicio
            </h2>
            <p>
              Sintia es una infraestructura de software que permite a agencias y negocios locales desplegar y configurar
              asistentes virtuales potenciados por inteligencia artificial generativa con llamada a herramientas
              (<i>function calling</i>).
            </p>
            <p>Las funciones principales incluyen:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>Recepción y respuesta de consultas en tiempo real por WhatsApp y chat web.</li>
              <li>Consulta de disponibilidad y agendamiento directo en Google Calendar.</li>
              <li>Generación de enlaces de pago mediante Stripe para cobro de anticipos o señas.</li>
              <li>Notificaciones internas al equipo a través de Slack o correo electrónico con Gmail.</li>
              <li>Sincronización de contactos en Google Sheets y webhooks externos.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                3
              </span>
              Uso Responsable y Límites de la Inteligencia Artificial
            </h2>
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Limitación de Responsabilidad Médica y Diagnóstica</span>
              </div>
              <p>
                El asistente de IA opera como una herramienta complementaria de atención y agendamiento administrativo.
                Bajo ninguna circunstancia sustituye el criterio, valoración presencial, diagnóstico ni tratamiento de un
                profesional de la salud matriculado. Sintia no prescribe medicamentos ni emite diagnósticos clínicos.
              </p>
            </div>
            <p className="pt-2">
              El administrador del negocio se compromete a mantener actualizada la información de precios, horarios y
              servicios en la Base de Conocimiento, así como a revisar periódicamente las alertas de handoff humano.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                4
              </span>
              Conexión con WhatsApp y Servicios de Terceros
            </h2>
            <p>
              La vinculación con WhatsApp se efectúa mediante protocolos multi-dispositivo (Baileys). El usuario es
              responsable de utilizar su línea telefónica en cumplimiento con las Políticas de Comercio y Términos de
              Servicio de Meta Platforms, Inc. Sintia no es responsable por suspensiones de cuenta derivadas del envío
              masivo de spam o prácticas no autorizadas por terceros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                5
              </span>
              Propiedad Intelectual y Licenciamiento
            </h2>
            <p>
              Todos los derechos de propiedad intelectual sobre el código fuente, la marca Sintia, interfaces gráficas y
              diseños pertenecen a sus legítimos titulares. Se concede al usuario una licencia de uso no exclusiva para
              la operación interna o instalación en clientes de su agencia.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                6
              </span>
              Legislación Aplicable y Jurisdicción
            </h2>
            <p>
              Las presentes Condiciones se regirán e interpretarán de acuerdo con las leyes de la República de Colombia.
              Cualquier controversia derivada de este acuerdo será sometida a los tribunales competentes de la ciudad de
              Cartagena de Indias, Bolívar, Colombia.
            </p>
          </section>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Sintia. Todos los derechos reservados.</div>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="hover:text-indigo-600 dark:hover:text-indigo-400">Landing</Link>
            <Link href="/privacidad" className="hover:text-indigo-600 dark:hover:text-indigo-400">Aviso de privacidad</Link>
            <Link href="/eliminacion-datos" className="hover:text-indigo-600 dark:hover:text-indigo-400">Eliminación de datos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
