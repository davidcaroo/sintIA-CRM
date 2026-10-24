import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Shield, Lock, FileText, CheckCircle2, Server, Database } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Aviso de Privacidad — Sintia CRM",
  description: "Política de tratamiento de datos personales y privacidad para la plataforma tecnológica Sintia CRM bajo la Ley 1581 de 2012.",
};

export default function PrivacidadPage() {
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
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">Sintia CRM</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Ley 1581 de 2012 • Habeas Data • Rol de Proveedor Tecnológico</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Aviso de Privacidad y Política de Tratamiento de Datos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Última actualización: 23 de octubre de 2026 • Cartagena de Indias, Bolívar, Colombia
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed space-y-7 text-slate-700 dark:text-slate-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                1
              </span>
              Rol Legal de Sintia: Proveedor de Software y Encargado del Tratamiento
            </h2>
            <p>
              El presente Aviso de Privacidad regula el tratamiento de información realizado por la plataforma de software <strong>Sintia CRM</strong>.
            </p>
            <p>
              De conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia, se aclara que:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                <strong>El Cliente Suscriptor / Negocio Administrador</strong> actúa como el <strong>Responsable del Tratamiento</strong> de los datos personales de sus propios clientes, pacientes o prospectos con quienes entable comunicación a través del CRM.
              </li>
              <li>
                <strong>Sintia</strong> actúa en calidad de <strong>Encargado del Tratamiento (Data Processor)</strong>, suministrando la infraestructura tecnológica de alojamiento, base de datos e integración con APIs de IA para permitir la operatividad del software.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                2
              </span>
              Datos Técnicos Procesados en la Plataforma
            </h2>
            <p>Para la correcta prestación técnica del CRM, el sistema almacena y procesa:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                <strong>Datos de la Cuenta del Suscriptor:</strong> Nombre, correo corporativo, contraseñas con hash criptográfico unidireccional (bcrypt), logs de actividad y claves de integración de APIs.
              </li>
              <li>
                <strong>Datos de Mensajería:</strong> Identificadores telefónicos (JID de WhatsApp), nombres reportados en el perfil de WhatsApp, texto de las conversaciones y fechas de interacción.
              </li>
              <li>
                <strong>Datos de Eventos e Integraciones:</strong> Citas agendadas en Google Calendar, identificadores de sesión de pago en Stripe y registros de entrega en webhooks o Slack.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                3
              </span>
              Finalidades Técnicas del Procesamiento
            </h2>
            <p>El tratamiento de datos por parte de Sintia se restringe estrictamente a finalidades técnicas de software:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Enrutamiento y Respuestas IA</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transmitir las preguntas del usuario al modelo LLM configurado (vía OpenRouter) para generar la contestación correspondiente.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Sincronización de Calendario</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Escribir y verificar eventos en la cuenta autorizada de Google Calendar del negocio.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Seguridad y Cifrado</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Custodiar credenciales y tokens mediante cifrado simétrico AES-256-GCM.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Bandeja de Entrada Multicanal</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Presentar las conversaciones en tiempo real en el panel para toma de control por agentes humanos.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                4
              </span>
              Transferencia y Servicios de IA de Terceros
            </h2>
            <p>
              Para generar respuestas automáticas, el texto de las conversaciones es enviado de forma cifrada a través
              del proveedor de inferencia <strong>OpenRouter</strong> hacia modelos de lenguaje autorizados (Anthropic,
              OpenAI, Google). Sintia instruye la no utilización de estos datos con fines de re-entrenamiento público de
              modelos fundacionales cuando las opciones del proveedor lo permitan.
            </p>
            <p>
              <strong>Sintia jamás vende, comercializa ni cede bases de datos de clientes ni listas de contactos a anunciantes o terceros.</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                5
              </span>
              Mecanismos para la Supresión de Datos
            </h2>
            <p>
              Cualquier usuario final o negocio suscriptor puede solicitar en cualquier momento la eliminación total de
              sus registros, números telefónicos o transcripciones de conversación mediante nuestro canal automatizado
              de{" "}
              <Link href="/eliminacion-datos" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                Eliminación de Datos
              </Link>{" "}
              o escribiendo directamente a <code>privacidad@sintia.local</code>.
            </p>
          </section>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Sintia CRM Platform. Todos los derechos reservados.</div>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="hover:text-indigo-600 dark:hover:text-indigo-400">Landing</Link>
            <Link href="/terminos" className="hover:text-indigo-600 dark:hover:text-indigo-400">Condiciones del servicio</Link>
            <Link href="/eliminacion-datos" className="hover:text-indigo-600 dark:hover:text-indigo-400">Eliminación de datos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
