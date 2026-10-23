"use client";

import React, { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Smartphone,
  CreditCard,
  Slack,
  Table,
  Mail,
  Bot,
  Zap,
  Globe,
  Users,
  ChevronRight,
  Play,
  Layers,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { SintiaHero3D } from "@/components/landing/SintiaHero3D";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingDemoPage() {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "calendar" | "stripe">("whatsapp");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
      {/* Script interactivo real del widget de chat de Sintia */}
      <Script src="/api/widget.js" strategy="afterInteractive" />

      {/* 1. Barra Superior Informativa */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">
              Sintia v1.0 • Plataforma White-Label de Asistentes IA para Agencias y Negocios Locales
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link
              href="/"
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              <span>Acceso al Panel</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Navbar de la Landing */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                Sintia
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                AI Assistant Platform
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <a href="#caracteristicas" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Características
            </a>
            <a href="#integraciones" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Integraciones
            </a>
            <a href="#como-funciona" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Cómo Funciona
            </a>
            <a href="#agencias" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Para Agencias
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
            >
              <span>Entrar al Panel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION CON EXPERIENCIA 3D INTERACTIVA */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
        {/* Luces de fondo ambientales */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-sky-500/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Columna Izquierda: Copywriting y Llamadas a la acción */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Asistente de IA para WhatsApp y Web • Cartagena de Indias, Colombia</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.1]">
                Atiende a tus clientes, agenda citas en <span className="text-indigo-600 dark:text-indigo-400">Google Calendar</span> y recibe anticipos 24/7.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                El asistente virtual que una agencia instala a cada negocio local en minutos sin tocar código. Conexión nativa con <strong>WhatsApp (Baileys)</strong>, <strong>Stripe</strong>, <strong>Slack</strong> y <strong>Google Sheets</strong> adaptado a la zona horaria <em>America/Bogota</em> y moneda colombiana ($ COP).
              </p>

              {/* Botones de acción principal */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span>Abrir Panel de Control</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    const bubble = document.getElementById("sintia-chat-bubble");
                    if (bubble) bubble.click();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs transition"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Probar Chat en Vivo</span>
                </button>
              </div>

              {/* Puntos clave */}
              <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-200/80 dark:border-slate-800/80 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">&lt; 8 seg</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Búfer inteligente de mensaje</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">100%</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Control sin tocar código</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">Madrid</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Horarios y festivos locales</div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Escena 3D WebGL con Three.js */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="w-full h-[440px] sm:h-[500px] lg:h-[560px] relative">
                <SintiaHero3D />

                {/* Tarjetas flotantes con datos reales sobre el 3D */}
                <div className="absolute top-6 left-2 sm:-left-4 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 dark:shadow-black/40 text-xs flex items-center gap-3 animate-in fade-in slide-in-from-left duration-700">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>WhatsApp Business</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">+34 912 345 678 • En línea</div>
                  </div>
                </div>

                <div className="absolute bottom-6 right-2 sm:-right-4 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 dark:shadow-black/40 text-xs flex items-center gap-3 animate-in fade-in slide-in-from-right duration-700">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">Cita Agendada en Calendario</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Viernes 11:30h • Dr. Morales</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BANNER INTERACTIVO DE PRUEBA EN VIVO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="p-5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm">¿Quieres ver a Sintia en acción ahora mismo?</div>
              <div className="text-xs text-indigo-100">
                La burbuja flotante situada abajo a la derecha está conectada en directo a este servidor.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const bubble = document.getElementById("sintia-chat-bubble");
              if (bubble) bubble.click();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-900 bg-white hover:bg-indigo-50 shadow-sm transition active:scale-95 shrink-0"
          >
            Abrir chat interactivo
          </button>
        </div>
      </section>

      {/* 5. SECCIÓN BENTO GRID: CARACTERÍSTICAS Y CAPACIDADES */}
      <section id="caracteristicas" className="py-20 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/80 dark:border-indigo-800">
              Arquitectura Robusta y Diseñada para Negocios
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Todo lo que un negocio local necesita para no perder ni un solo cliente
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configurable íntegramente desde el panel visual, sin tocar código ni desplegar servidores por cada cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: WhatsApp y Webchat */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">WhatsApp & Webchat Multicanal</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Conexión Baileys con código QR persistente en disco. Dispone de un búfer de debounce de 8 segundos para agrupar mensajes continuos y responder de forma pausada y humana.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>QR en tiempo real con SSE</span>
              </div>
            </div>

            {/* Card 2: Google Calendar */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Google Calendar Autónomo</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Consulta huecos libres reales, respeta horarios de mañana y tarde, márgenes entre pacientes y tiempos de antelación. Reserva citas con el nombre y teléfono del cliente.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>OAuth oficial sin caducidad</span>
              </div>
            </div>

            {/* Card 3: Stripe Checkout */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Cobro de Señales con Stripe</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Reduce el absentismo (*no-shows*) generando enlaces de pago seguros para pedir una fianza o señal antes de bloquear la agenda. Admite claves de prueba y producción.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enlaces de Checkout protegidos</span>
              </div>
            </div>

            {/* Card 4: Traspaso Humano */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Traspaso Humano en Directo</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Si detecta quejas, urgencias médicas o el cliente pide hablar con alguien, Sintia se silencia al instante, notifica a Slack y te permite tomar el control desde la bandeja.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Botón "Tomar el control" en 1 clic</span>
              </div>
            </div>

            {/* Card 5: Importador Web con IA */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Importador Web Inteligente</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pega la web del cliente. El servidor descarga la portada y hasta 5 subpáginas clave, extrayendo automáticamente el catálogo de servicios, tarifas y preguntas frecuentes.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Extracción JSON asistida por IA</span>
              </div>
            </div>

            {/* Card 6: Modo Seguro y Simulación */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Línea de Tiempo y Modo Seguro</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Prueba el asistente antes de conectarlo a clientes reales. La pantalla Probar enseña la línea de tiempo paso a paso y el Modo Seguro simula las reservas sin tocar tu calendario.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Inspección transparente de tools</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DEMOSTRACIÓN VISUAL DE HERRAMIENTAS DE IA */}
      <section id="como-funciona" className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Así razona Sintia con cada mensaje del cliente
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              A diferencia de un chatbot genérico, Sintia ejecuta acciones reales paso a paso mediante llamada a herramientas (Tools Calling).
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  S
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Simulación en Vivo</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Canal: WhatsApp Business</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                Herramientas en Vivo
              </span>
            </div>

            {/* Conversación paso a paso */}
            <div className="space-y-4 text-xs">
              {/* Mensaje 1: Cliente */}
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[11px]">
                  C
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 max-w-md">
                  Hola, ¿cuánto cuesta una limpieza dental y qué huecos tenéis para este viernes por la mañana?
                </div>
              </div>

              {/* Ejecución de herramientas intermedias */}
              <div className="pl-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-[11px] font-mono">
                  <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>consultar_huecos_libres(servicio: "Limpieza", fecha: "2026-10-24")</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-2">
                  ↳ Google Calendar devuelve 3 huecos: 10:00h, 11:30h y 12:45h
                </div>
              </div>

              {/* Mensaje 2: Sintia */}
              <div className="flex gap-3 justify-end">
                <div className="p-3.5 rounded-2xl bg-indigo-600 text-white max-w-md space-y-1">
                  <div>
                    ¡Hola! La limpieza dental profesional cuesta <strong>45 €</strong> (unos 45 minutos de duración).
                  </div>
                  <div>
                    Para este viernes tenemos disponibles: <strong>10:00h</strong>, <strong>11:30h</strong> y <strong>12:45h</strong>. ¿Cuál te viene mejor?
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-indigo-700 text-white font-bold flex items-center justify-center text-[11px]">
                  S
                </div>
              </div>

              {/* Mensaje 3: Cliente */}
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[11px]">
                  C
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 max-w-md">
                  A las 11:30h me viene genial. Soy Laura Martín, 622334455.
                </div>
              </div>

              {/* Ejecución de citas y avisos */}
              <div className="pl-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>crear_cita(cliente: "Laura Martín", hora: "11:30h", servicio: "Limpieza")</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-[11px] font-mono">
                  <Slack className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>notificar_al_equipo(evento: "Nueva cita confirmada en agenda")</span>
                </div>
              </div>

              {/* Mensaje 4: Sintia */}
              <div className="flex gap-3 justify-end">
                <div className="p-3.5 rounded-2xl bg-indigo-600 text-white max-w-md">
                  ¡Perfecto, Laura! Te he reservado la cita para el <strong>viernes a las 11:30h</strong> en nuestra clínica de Gran Vía 32. Te acabamos de enviar un recordatorio. ¡Nos vemos pronto!
                </div>
                <div className="w-7 h-7 rounded-full bg-indigo-700 text-white font-bold flex items-center justify-center text-[11px]">
                  S
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECCIÓN INTEGRACIONES Y MODELOS */}
      <section id="integraciones" className="py-20 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Las 6 integraciones que hacen funcionar el negocio
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Conectores nativos con cifrado AES-256-GCM. Los tokens nunca se muestran en texto plano.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Google Calendar", desc: "Gestión de citas y huecos libres", icon: Calendar, color: "text-sky-600 dark:text-sky-400" },
              { name: "Gmail", desc: "Confirmaciones y resumen diario", icon: Mail, color: "text-red-600 dark:text-red-400" },
              { name: "Google Sheets", desc: "Sincronización de contactos", icon: Table, color: "text-emerald-600 dark:text-emerald-400" },
              { name: "Slack", desc: "Avisos al equipo y handoff", icon: Slack, color: "text-purple-600 dark:text-purple-400" },
              { name: "Stripe", desc: "Cobro de señales por servicio", icon: CreditCard, color: "text-indigo-600 dark:text-indigo-400" },
              { name: "Webhooks", desc: "Conexión con n8n, Make y Zapier", icon: Zap, color: "text-amber-600 dark:text-amber-400" },
            ].map((it, idx) => {
              const Icon = it.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-center space-y-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto">
                    <Icon className={`w-5 h-5 ${it.color}`} />
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{it.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{it.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. SECCIÓN PARA AGENCIAS Y WHITE-LABEL */}
      <section id="agencias" className="py-20 bg-indigo-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-sm">
              Modelo de Negocio para Agencias
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Instala asistentes para tus clientes y cobra una cuota recurrente mensual.
            </h2>
            <p className="text-sm sm:text-base text-indigo-200 leading-relaxed">
              Sintia te permite desplegar un panel completo con tu propia marca (*white-label*). Olvídate de programar integraciones desde cero por cada cliente: configura el tono, servicios y canales en 5 minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs">
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-2">
              <div className="text-2xl font-bold text-white">0 € en Servidores Caros</div>
              <p className="text-indigo-200">
                El motor OpenRouter te permite usar modelos como Claude Haiku 5.5 o GPT-4o-mini con costes inferiores a 1-2 $ por cada 1.000 conversaciones.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-2">
              <div className="text-2xl font-bold text-white">Tu Marca y Logotipo</div>
              <p className="text-indigo-200">
                Tus clientes verán en todo momento tu nombre de agencia en el menú, la cabecera y la pantalla de acceso.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-2">
              <div className="text-2xl font-bold text-white">Despliegue con Docker</div>
              <p className="text-indigo-200">
                Incluye Dockerfile multi-etapa y docker-compose listos para VPS (Hostinger, Hetzner) con SSL automático mediante Traefik.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-indigo-950 bg-white hover:bg-indigo-50 shadow-lg shadow-black/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Acceder al Panel de Control de Sintia</span>
              <ArrowRight className="w-4 h-4 text-indigo-900" />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. PIE DE PÁGINA */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Sintia</span>
            <span>— Asistente de IA para Negocios Locales</span>
          </div>

          <div>
            Cartagena de Indias, Bolívar, Colombia • Zona Horaria: <strong>America/Bogota</strong> • Español Colombia
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">
              Panel
            </Link>
            <Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">
              Iniciar Sesión
            </Link>
            <Link href="/probar" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">
              Simulador
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
