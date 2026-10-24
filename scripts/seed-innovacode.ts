import { db } from "../src/lib/db";

export async function populateInnovaCodeData() {
  console.log("🚀 [InnovaCode] Inicializando configuración y base de conocimiento...");

  // 1. Información del Negocio
  await db.businessInfo.upsert({
    where: { id: "default" },
    update: {
      name: "InnovaCode Solutions",
      activity: "Desarrollo de Software a Medida, Inteligencia Artificial y Automatización de Procesos",
      address: "Colombia (Servicio para Colombia y LATAM)",
      phone: "+57 311 606 1807",
      website: "https://innovacode-tech.vercel.app",
      agencyName: "InnovaCode Tech",
      timezone: "America/Bogota",
    },
    create: {
      id: "default",
      name: "InnovaCode Solutions",
      activity: "Desarrollo de Software a Medida, Inteligencia Artificial y Automatización de Procesos",
      address: "Colombia (Servicio para Colombia y LATAM)",
      phone: "+57 311 606 1807",
      website: "https://innovacode-tech.vercel.app",
      agencyName: "InnovaCode Tech",
      timezone: "America/Bogota",
    },
  });

  // 2. Configuración del Asistente
  await db.assistantConfig.upsert({
    where: { id: "default" },
    update: {
      name: "Sintia de InnovaCode",
      tone: "profesional",
      welcomeMessage: "¡Hola! Te damos la bienvenida a InnovaCode Solutions. 🚀 Desarrollamos software a medida, agentes de Inteligencia Artificial y automatizaciones para transformar tu negocio. ¿En qué proyecto o solución podemos asesorarte hoy?",
      customInstructions: "Eres Sintia, la consultora de tecnología e IA de InnovaCode Solutions (https://innovacode-tech.vercel.app). Tu objetivo es asesorar a clientes interesados en software, cotizaciones de sitios web, automatizaciones con IA y agendar llamadas de consulta gratuita técnica por Google Calendar. Maneja los precios en Pesos Colombianos ($ COP) y Dólares ($ USD). Sé cordial, técnica, profesional y proactiva para guiar al usuario a agendar una consulta o cotizar.",
      neverDoRules: "- Nunca prometas tiempos de entrega menores a 5 días laborables sin previa validación técnica.\n- Nunca inventes descuentos o servicios fuera del catálogo oficial.\n- No prometas resultados de IA no viables técnicamente.\n- Ante requerimientos de cotización empresarial muy compleja o soporte crítico, solicita el correo y nombre y transfiere a un ingeniero humano con 'pasar_a_humano'.",
      afterHoursBehavior: "appointment",
      handoffOnComplaint: true,
      handoffOnUrgency: true,
      handoffOnRequest: true,
      handoffOnUnknown: true,
      handoffCustomRule: "Si el cliente solicita una reunión personalizada con el CTO o director de ingeniería de InnovaCode.",
    },
    create: {
      id: "default",
      isActive: true,
      name: "Sintia de InnovaCode",
      tone: "profesional",
      welcomeMessage: "¡Hola! Te damos la bienvenida a InnovaCode Solutions. 🚀 Desarrollamos software a medida, agentes de Inteligencia Artificial y automatizaciones para transformar tu negocio. ¿En qué proyecto o solución podemos asesorarte hoy?",
      customInstructions: "Eres Sintia, la consultora de tecnología e IA de InnovaCode Solutions (https://innovacode-tech.vercel.app). Tu objetivo es asesorar a clientes interesados en software, cotizaciones de sitios web, automatizaciones con IA y agendar llamadas de consulta gratuita técnica por Google Calendar. Maneja los precios en Pesos Colombianos ($ COP) y Dólares ($ USD). Sé cordial, técnica, profesional y proactiva para guiar al usuario a agendar una consulta o cotizar.",
      neverDoRules: "- Nunca prometas tiempos de entrega menores a 5 días laborables sin previa validación técnica.\n- Nunca inventes descuentos o servicios fuera del catálogo oficial.\n- No prometas resultados de IA no viables técnicamente.\n- Ante requerimientos de cotización empresarial muy compleja o soporte crítico, solicita el correo y nombre y transfiere a un ingeniero humano con 'pasar_a_humano'.",
      afterHoursBehavior: "appointment",
      handoffOnComplaint: true,
      handoffOnUrgency: true,
      handoffOnRequest: true,
      handoffOnUnknown: true,
      handoffCustomRule: "Si el cliente solicita una reunión personalizada con el CTO o director de ingeniería de InnovaCode.",
      model: "google/gemini-2.5-flash",
      fallbackModel: "anthropic/claude-haiku-5.5",
    },
  });

  // 3. Catálogo de Servicios Oficiales de InnovaCode
  await db.service.deleteMany({}); // Limpiar servicios anteriores

  const services = [
    {
      name: "Landing Page de Alta Conversión",
      description: "1 página de venta enfocada en resultados, hosting + dominio gratis por 1 año, SEO técnico e indexación en Google.",
      durationMinutes: 45,
      price: 800000,
      isFromPrice: false,
      requiresValuation: false,
      stripeDeposit: 200000,
      order: 1,
    },
    {
      name: "Página Web Informativa / Corporativa",
      description: "Sitio web completo de hasta 4 secciones (¿Quiénes somos?, Servicios, Contacto), integración con WhatsApp, hosting y dominio incluido.",
      durationMinutes: 45,
      price: 1500000,
      isFromPrice: false,
      requiresValuation: false,
      stripeDeposit: 400000,
      order: 2,
    },
    {
      name: "Tienda Online / E-commerce Completo",
      description: "Plataforma de comercio electrónico de hasta 4 secciones, carga de hasta 50 productos, pasarela de pagos integrada y capacitación técnica.",
      durationMinutes: 60,
      price: 2600000,
      isFromPrice: true,
      requiresValuation: false,
      stripeDeposit: 600000,
      order: 3,
    },
    {
      name: "Desarrollo de Software a Medida",
      description: "Creamos soluciones personalizadas (SaaS, plataformas web, apps) escalables y robustas adaptadas al flujo de tu empresa.",
      durationMinutes: 60,
      price: 4500000,
      isFromPrice: true,
      requiresValuation: true,
      stripeDeposit: 1000000,
      order: 4,
    },
    {
      name: "Inteligencia Artificial y Agentes Automatizados",
      description: "Implementación de IA (LLMs, agentes autónomos para WhatsApp/Web, RAG y análisis de datos) para automatizar y optimizar la operación.",
      durationMinutes: 45,
      price: 2000000,
      isFromPrice: true,
      requiresValuation: true,
      stripeDeposit: 500000,
      order: 5,
    },
    {
      name: "Automatización de Procesos (RPA & Workflows)",
      description: "Eliminación de tareas repetitivas conectando CRM, pasarelas de pago, bases de datos y herramientas de equipo (Make, n8n, Slack).",
      durationMinutes: 45,
      price: 1200000,
      isFromPrice: true,
      requiresValuation: true,
      stripeDeposit: 300000,
      order: 6,
    },
    {
      name: "Mantenimiento y Soporte Mensual",
      description: "Actualizaciones de seguridad, soporte técnico especializado y respaldo mensual continuo de tu sitio o plataforma.",
      durationMinutes: 30,
      price: 200000,
      isFromPrice: false,
      requiresValuation: false,
      stripeDeposit: 0,
      order: 7,
    },
    {
      name: "Consulta Técnica Inicial y Diagnóstico Gratuito",
      description: "Reunión de 30 minutos por Google Meet para revisar tu idea, alcance técnico, arquitectura recomendada y estimación de presupuesto.",
      durationMinutes: 30,
      price: 0,
      isFromPrice: false,
      requiresValuation: false,
      stripeDeposit: 0,
      order: 8,
    },
  ];

  for (const s of services) {
    await db.service.create({ data: s });
  }

  // 4. Preguntas Frecuentes (FAQs Oficiales de InnovaCode)
  await db.faq.deleteMany({}); // Limpiar anteriores

  const faqs = [
    {
      question: "¿Qué tecnologías utilizan para el desarrollo de software y web?",
      answer: "Trabajamos con el stack tecnológico más moderno y de alto rendimiento: Next.js, React, Node.js, TypeScript, Python para modelos de IA, Tailwind CSS y bases de datos PostgreSQL/Supabase, desplegadas en servidores cloud escalables (Vercel, AWS, VPS).",
      order: 1,
    },
    {
      question: "¿El hosting y el dominio están incluidos en los proyectos web?",
      answer: "Sí, todos nuestros planes de páginas web (Landing Page, Sitio Informativo y Tienda Online) incluyen el primer año de hosting de alta velocidad y dominio gratis, además de certificado SSL e indexación SEO técnica en Google.",
      order: 2,
    },
    {
      question: "¿Cómo se manejan los pagos y anticipos de los proyectos?",
      answer: "Generalmente trabajamos con un anticipo inicial del 50% al firmar la propuesta técnica y el 50% restante contra entrega y visto bueno a satisfacción. Para proyectos grandes a medida, dividimos los pagos por hitos cumplidos.",
      order: 3,
    },
    {
      question: "¿Puedo agregar secciones o páginas adicionales a mi sitio web?",
      answer: "Sí, puedes añadir secciones o páginas extra a cualquier diseño por $150.000 COP / $40 USD cada una.",
      order: 4,
    },
    {
      question: "¿Qué tipo de soluciones de Inteligencia Artificial pueden implementar?",
      answer: "Implementamos agentes de atención 24/7 para WhatsApp y Web (como Sintia), sistemas RAG con tus manuales internos, análisis predictivo de datos, visión artificial y automatización de procesos entre plataformas sin intervención humana.",
      order: 5,
    },
    {
      question: "¿Cómo agendo una reunión de asesoría técnica gratuita?",
      answer: "Puedes solicitarla directamente aquí en el chat indicándome el día y horario que te quede cómodo, o escribiéndonos directamente a nuestro WhatsApp +57 311 606 1807 o al correo contacto@innovacode.click.",
      order: 6,
    },
    {
      question: "¿Cuánto tiempo toma el desarrollo de una página o proyecto?",
      answer: "Una Landing Page suele estar lista en 3 a 5 días hábiles; una web informativa en 7 a 12 días; una tienda virtual en 2 a 3 semanas. Los proyectos de software e IA a medida se estiman según el backlog técnico acordado.",
      order: 7,
    },
    {
      question: "¿Ofrecen soporte y mantenimiento después de entregar el proyecto?",
      answer: "Sí, contamos con un plan de mantenimiento mensual por $200.000 COP ($55 USD) que cubre respaldos periódicos, actualizaciones de seguridad, cambios menores y soporte técnico prioritario.",
      order: 8,
    },
  ];

  for (const f of faqs) {
    await db.faq.create({ data: f });
  }

  console.log("✅ [InnovaCode] Base de datos, contexto, servicios y FAQs actualizados con éxito.");
}

populateInnovaCodeData()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
