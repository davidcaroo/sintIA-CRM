import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Cpu, Code2, Server } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Condiciones del Servicio — Sintia CRM",
  description: "Términos y condiciones de uso de la plataforma de software y CRM de IA Sintia.",
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
            <Code2 className="w-3.5 h-3.5" />
            <span>Acuerdo de Licencia de Software y Servicios Cloud (B2B SaaS)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Condiciones del Servicio — Plataforma Sintia
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Última actualización: 23 de octubre de 2026 • Regulado bajo la legislación comercial y de software de Colombia
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed space-y-7 text-slate-700 dark:text-slate-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                1
              </span>
              Naturaleza Exclusiva como Proveedor de Software Tecnológico
            </h2>
            <p>
              <strong>Sintia</strong> es única y exclusivamente un <strong>proveedor de infraestructura tecnológica, software como servicio (SaaS) y herramientas de software CRM con automatización por Inteligencia Artificial</strong>.
            </p>
            <p>
              Sintia <strong>no presta, no intermedia ni es parte de los servicios finales</strong> (sean estos de salud, odontología, estética, consultoría legal, comercio electrónico, hotelería o cualquier otra actividad económica) que el usuario, agencia o empresa suscriptora comercialice hacia sus propios clientes finales. Cada negocio que utiliza Sintia es el único y exclusivo responsable ante sus usuarios finales por la calidad, veracidad, cumplimiento y efectos legales de los servicios ofrecidos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                2
              </span>
              Alcance de la Licencia de Uso
            </h2>
            <p>
              Se concede al suscriptor o agencia una licencia limitada, revocable, no exclusiva e intransferible para
              desplegar, configurar y operar la suite de Sintia CRM (incluyendo panel web, conector Baileys para WhatsApp,
              widget web embebible y módulos de integración con terceros).
            </p>
            <p>Queda expresamente prohibido:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Utilizar el software para actividades ilícitas, fraudulentas, suplantación de identidad o engaño comercial.</li>
              <li>Elaborar campañas de spam masivo o mensajería no solicitada que violen normativas antispam o de protección al consumidor.</li>
              <li>Intentar descompilar, eludir protecciones de seguridad o comprometer la infraestructura de la base de datos o servidores.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                3
              </span>
              Exención de Responsabilidad por Modelos de Lenguaje e Inteligencia Artificial
            </h2>
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Naturaleza Probabilística de los Modelos LLM ("As Is" / "Tal Cual")</span>
              </div>
              <p>
                Los asistentes virtuales integrados en Sintia se ejecutan mediante APIs y modelos de lenguaje de terceros
                (tales como OpenRouter, Anthropic, OpenAI o Google). Dichos modelos operan mediante algoritmos
                probabilísticos y pueden presentar alucinaciones, respuestas inexactas o desactualizadas.
              </p>
              <p>
                <strong>Sintia no garantiza la infalibilidad técnica ni la exactitud material de los textos emitidos por los modelos de IA.</strong> El
                administrador de cada cuenta es el único responsable de auditar las instrucciones del sistema (prompt),
                alimentar correctamente su base de conocimiento y activar las reglas de traspaso a supervisión humana
                (<i>handoff</i>) cuando sea necesario.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                4
              </span>
              Conexión con WhatsApp y Riesgos Operativos de Plataformas Externas
            </h2>
            <p>
              La vinculación del canal de WhatsApp se efectúa a través de protocolos de socket multi-dispositivo (librería
              Baileys). WhatsApp y Meta Platforms Inc. son compañías independientes y ajenas a Sintia.
            </p>
            <p>
              El suscriptor reconoce y acepta expresamente que el uso de cualquier automatización en WhatsApp conlleva
              riesgos de desconexión, actualización de protocolos o incluso bloqueo/suspensión de líneas por parte de Meta si
              se detectan patrones de abuso o incumplimiento de sus Políticas de Comercio. <strong>Sintia no se hace responsable
              por sanciones, bloqueos de números telefónicos o interrupciones de servicio originadas por decisiones de Meta Platforms Inc.</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                5
              </span>
              Pasarelas de Pago e Integraciones de Terceros (Stripe, Google, Slack)
            </h2>
            <p>
              Sintia provee conectores técnicos hacia servicios externos como Google Calendar, Gmail, Google Sheets,
              Stripe y Slack.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                <strong>Pagos y Señas (Stripe):</strong> Sintia genera enlaces de cobro, pero no procesa, no custodia ni
                retiene fondos bancarios. Cualquier disputa, contracargo, comisión o retención fiscal corresponde a la
                relación directa entre el suscriptor y Stripe Inc.
              </li>
              <li>
                <strong>Disponibilidad de APIs:</strong> No nos responsabilizamos por caídas de servicio, modificaciones de
                cuotas o revocaciones de permisos en las plataformas de Google LLC, Slack Technologies o pasarelas de pago.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                6
              </span>
              Disponibilidad, Mantenimiento y Límite de Responsabilidad
            </h2>
            <p>
              El software se entrega "tal cual" y "según disponibilidad". Sintia realiza esfuerzos comercialmente
              razonables para mantener una disponibilidad continua del servicio; sin embargo, no garantiza que la
              operación esté libre de errores o paradas programadas por mantenimiento.
            </p>
            <p>
              En la máxima medida permitida por la ley aplicable, la responsabilidad total de Sintia ante el suscriptor
              por cualquier daño derivado del uso o imposibilidad de uso del software estará limitada al valor total
              pagado por el suscriptor por la licencia del software durante los últimos tres (3) meses anteriores al
              hecho generador del reclamo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                7
              </span>
              Ley Aplicable y Jurisdicción
            </h2>
            <p>
              Estas Condiciones de Software se rigen íntegramente por las leyes comerciales de la República de Colombia.
              Cualquier controversia relacionada con la validez, ejecución o terminación de este contrato se resolverá
              ante los juzgados y tribunales competentes de la ciudad de Cartagena de Indias, Bolívar, Colombia.
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
            <Link href="/privacidad" className="hover:text-indigo-600 dark:hover:text-indigo-400">Aviso de privacidad</Link>
            <Link href="/eliminacion-datos" className="hover:text-indigo-600 dark:hover:text-indigo-400">Eliminación de datos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
