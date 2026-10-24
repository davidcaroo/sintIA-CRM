import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Shield, Lock, FileText, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Aviso de Privacidad — Sintia",
  description: "Política de tratamiento de datos personales y privacidad de Sintia de conformidad con la Ley 1581 de 2012.",
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
            <Shield className="w-3.5 h-3.5" />
            <span>Habeas Data & Ley 1581 de 2012</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Aviso de Privacidad y Política de Tratamiento de Datos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Última actualización: 23 de octubre de 2026 • Cartagena de Indias, Bolívar, Colombia
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed space-y-6 text-slate-700 dark:text-slate-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                1
              </span>
              Identificación del Responsable del Tratamiento
            </h2>
            <p>
              <strong>Sintia</strong> (en adelante, la "Plataforma"), operada como solución tecnológica de software para
              agencias y negocios locales en Cartagena de Indias, Bolívar, República de Colombia, es la responsable del
              tratamiento de los datos personales recolectados a través de sus canales de atención (WhatsApp mediante
              Baileys y widget de chat web embebible).
            </p>
            <p>
              Para cualquier consulta o ejercicio de derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), el
              canal oficial de contacto es el correo electrónico:{" "}
              <a href="mailto:privacidad@sintia.local" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                privacidad@sintia.local
              </a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                2
              </span>
              Datos Personales que Recolectamos
            </h2>
            <p>
              Cuando un cliente o usuario interactúa con el asistente de IA a través de WhatsApp o el chat web, la
              plataforma puede recolectar y almacenar:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>
                <strong>Datos de contacto:</strong> Nombre completo, número de teléfono (JID de WhatsApp), correo electrónico y dirección suministrada voluntariamente.
              </li>
              <li>
                <strong>Historial de conversaciones:</strong> Mensajes de texto intercambiados con el asistente virtual para dar seguimiento a citas y consultas.
              </li>
              <li>
                <strong>Datos de agendamiento:</strong> Servicio de interés, fecha y hora de la cita programada en Google Calendar.
              </li>
              <li>
                <strong>Datos técnicos:</strong> Dirección IP aproximada y metadatos de sesión web exclusivamente para seguridad y prevención de abusos.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                3
              </span>
              Finalidades del Tratamiento
            </h2>
            <p>Los datos suministrados tienen las siguientes finalidades legítimas:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Atención al Cliente 24/7</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Responder dudas sobre horarios, tratamientos, precios y ubicación en Cartagena.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Agendamiento en Calendario</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Coordinar citas en Google Calendar y enviar confirmaciones y recordatorios automáticos.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Recepción de Anticipos</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generación de enlaces de pago seguro (Stripe) para la seña de reserva.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Traspaso a un Humano</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transferir la conversación a un miembro del equipo ante quejas o urgencias.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                4
              </span>
              Seguridad, Cifrado y Conservación
            </h2>
            <p>
              La plataforma adopta rigurosos estándares técnicos para proteger la información:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>
                <strong>Cifrado de grado militar:</strong> Todos los tokens de acceso e integraciones se almacenan cifrados con algoritmo <code>AES-256-GCM</code>.
              </li>
              <li>
                <strong>Sesión local de WhatsApp:</strong> Las credenciales multi-dispositivo residen en el servidor seguro y nunca se exponen al cliente.
              </li>
              <li>
                <strong>No venta de datos:</strong> Jamás vendemos, alquilamos ni comercializamos las bases de datos de clientes o pacientes con terceros con fines publicitarios.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs">
                5
              </span>
              Derechos del Titular y Procedimiento de Supresión
            </h2>
            <p>
              Como titular de sus datos personales bajo la ley colombiana, usted tiene derecho a conocer, actualizar,
              rectificar y revocar la autorización o solicitar la eliminación total de sus datos de nuestras bases de
              datos en cualquier momento.
            </p>
            <p>
              Para ejercer de inmediato este derecho o consultar los pasos automatizados, diríjase a nuestra sección
              específica de{" "}
              <Link href="/eliminacion-datos" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                Eliminación de Datos
              </Link>.
            </p>
          </section>
        </div>
      </main>

      {/* Pie de página secundario */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Sintia. Todos los derechos reservados.</div>
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
