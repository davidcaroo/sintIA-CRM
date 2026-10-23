import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedDemoData() {
  console.log("🌱 Iniciando siembra de datos de demostración...");

  // 1. Usuario Administrador
  const adminEmail = process.env.ADMIN_EMAIL || "admin@sintia.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: adminEmail,
      name: "Administrador Lumen",
      passwordHash: hashedPassword,
      role: "admin",
    },
  });
  console.log(`✅ Usuario administrador verificado: ${adminEmail}`);

  // 2. Información del Negocio
  await prisma.businessInfo.upsert({
    where: { id: "default" },
    update: {
      address: "Carrera 3ra # 6-45, Bocagrande, Cartagena de Indias, Bolívar",
      phone: "+57 300 912 3456",
      website: "https://clinicalumen.co",
      timezone: "America/Bogota",
    },
    create: {
      id: "default",
      name: "Clínica Dental Lumen",
      activity: "Clínica odontológica multidisciplinar avanzada para toda la familia en Cartagena de Indias",
      address: "Carrera 3ra # 6-45, Bocagrande, Cartagena de Indias, Bolívar",
      phone: "+57 300 912 3456",
      website: "https://clinicalumen.co",
      agencyName: "Sintia Agency",
      timezone: "America/Bogota",
    },
  });

  // 3. Configuración del Asistente
  const defaultBusinessHours = {
    monday: { active: true, morningOpen: "08:00", morningClose: "12:00", afternoonOpen: "14:00", afternoonClose: "18:00" },
    tuesday: { active: true, morningOpen: "08:00", morningClose: "12:00", afternoonOpen: "14:00", afternoonClose: "18:00" },
    wednesday: { active: true, morningOpen: "08:00", morningClose: "12:00", afternoonOpen: "14:00", afternoonClose: "18:00" },
    thursday: { active: true, morningOpen: "08:00", morningClose: "12:00", afternoonOpen: "14:00", afternoonClose: "18:00" },
    friday: { active: true, morningOpen: "08:00", morningClose: "12:00", afternoonOpen: "14:00", afternoonClose: "18:00" },
    saturday: { active: true, morningOpen: "09:00", morningClose: "13:00", afternoonOpen: "", afternoonClose: "" },
    sunday: { active: false, morningOpen: "", morningClose: "", afternoonOpen: "", afternoonClose: "" },
  };

  await prisma.assistantConfig.upsert({
    where: { id: "default" },
    update: {
      welcomeMessage: "¡Cordial saludo! Le atiende Sintia, asistente de la Clínica Dental Lumen en Cartagena de Indias. ¿En qué le podemos colaborar hoy?",
      customInstructions: "Atiende con amabilidad colombiana, calidez y tono profesional («con mucho gusto», «un placer colaborarle»). Tu objetivo es resolver dudas sobre tratamientos y facilitar la reserva de citas en la clínica en Bocagrande, Cartagena de Indias. Moneda en Pesos Colombianos ($ COP) y zona horaria America/Bogota.",
    },
    create: {
      id: "default",
      isActive: true,
      name: "Sintia",
      tone: "cercano",
      welcomeMessage: "¡Cordial saludo! Le atiende Sintia, asistente de la Clínica Dental Lumen en Cartagena de Indias. ¿En qué le podemos colaborar hoy?",
      customInstructions: "Atiende con amabilidad colombiana, calidez y tono profesional («con mucho gusto», «un placer colaborarle»). Tu objetivo es resolver dudas sobre tratamientos y facilitar la reserva de citas en la clínica en Bocagrande, Cartagena de Indias. Moneda en Pesos Colombianos ($ COP) y zona horaria America/Bogota.",
      neverDoRules: "- Nunca des diagnósticos médicos ni formules antibióticos o medicamentos de control.\n- Nunca inventes precios o tratamientos que no estén en el catálogo oficial en pesos colombianos ($ COP).\n- Nunca prometas resultados clínicos garantizados al 100%.\n- Ante cualquier dolor agudo, hemorragia o traumatismo severo, avisa de que es una urgencia, pasa la conversación a una persona y facilita el teléfono directo (+57 300 912 3456).",
      businessHours: defaultBusinessHours,
      afterHoursBehavior: "appointment",
      handoffOnComplaint: true,
      handoffOnUrgency: true,
      handoffOnRequest: true,
      handoffOnUnknown: true,
      handoffCustomRule: "Si el paciente menciona estar disgustado con un tratamiento anterior o solicita hablar con la directora médica.",
      model: "anthropic/claude-haiku-5.5",
      fallbackModel: "anthropic/claude-haiku-5.5",
    },
  });

  // 4. Servicios (8 servicios en COP)
  const servicesData = [
    {
      name: "Primera visita y valoración diagnóstica",
      description: "Valoración clínica completa con radiografía panorámica digital y plan de tratamiento personalizado.",
      durationMinutes: 30,
      price: 0,
      isFromPrice: false,
      requiresValuation: false,
      stripeDeposit: 0,
      order: 1,
    },
    {
      name: "Limpieza dental profunda y profilaxis con ultrasonido",
      description: "Eliminación de cálculo dental (sarro), manchas extrínsecas y pulido dental con pasta profiláctica.",
      durationMinutes: 45,
      price: 120000,
      isFromPrice: false,
      requiresValuation: false,
      stripeDeposit: 50000,
      order: 2,
    },
    {
      name: "Resina estética de alta densidad (calza dental)",
      description: "Eliminación de caries y reconstrucción anatómica con resinas estéticas de última generación.",
      durationMinutes: 45,
      price: 130000,
      isFromPrice: true,
      requiresValuation: false,
      stripeDeposit: 50000,
      order: 3,
    },
    {
      name: "Endodoncia (tratamiento de conducto)",
      description: "Tratamiento biomecánico rotatorio con sellado tridimensional para conservar la pieza dental.",
      durationMinutes: 60,
      price: 350000,
      isFromPrice: true,
      requiresValuation: false,
      stripeDeposit: 100000,
      order: 4,
    },
    {
      name: "Blanqueamiento dental LED en consultorio",
      description: "Protocolo clínico intensivo con lámpara de luz fría y peróxido para aclarar varios tonos en una sola sesión.",
      durationMinutes: 60,
      price: 450000,
      isFromPrice: false,
      requiresValuation: false,
      stripeDeposit: 100000,
      order: 5,
    },
    {
      name: "Ortodoncia invisible con alineadores transparentes",
      description: "Corrección de apiñamiento y mordida mediante placas removibles estéticas. Incluye escaneo 3D previo.",
      durationMinutes: 45,
      price: 4800000,
      isFromPrice: true,
      requiresValuation: true,
      stripeDeposit: 200000,
      order: 6,
    },
    {
      name: "Implante dental en titanio biocompatible con corona",
      description: "Rehabilitación de pieza ausente mediante implante osteointegrado y corona en porcelana/zirconio.",
      durationMinutes: 60,
      price: 2600000,
      isFromPrice: true,
      requiresValuation: true,
      stripeDeposit: 300000,
      order: 7,
    },
    {
      name: "Atención prioritaria de urgencia odontológica",
      description: "Alivio inmediato de dolor agudo, trauma dental o absceso en Cartagena de Indias.",
      durationMinutes: 30,
      price: 90000,
      isFromPrice: false,
      requiresValuation: false,
      stripeDeposit: 0,
      order: 8,
    },
  ];

  for (const s of servicesData) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.service.create({ data: s });
    }
  }

  // 5. Preguntas Frecuentes (10 FAQs adaptadas a Cartagena y Colombia)
  const faqsData = [
    {
      question: "¿La primera consulta y valoración tienen algún costo?",
      answer: "No, la primera visita de valoración con radiografía panorámica digital y diagnóstico es 100% gratuita y sin ningún compromiso para usted.",
      order: 1,
    },
    {
      question: "¿Tienen convenios con pólizas de salud o medicina prepagada?",
      answer: "Trabajamos mediante modalidad de reembolso y convenio para atención particular con Colmédica, Sura Medicina Prepagada, Seguros Bolívar y Coomeva.",
      order: 2,
    },
    {
      question: "¿Ofrecen facilidades de pago o cuotas para los tratamientos?",
      answer: "Sí, con mucho gusto ofrecemos opciones de financiación sin intereses a través de Addi, Sistecrédito y tarjetas de crédito bancarias hasta en 24 cuotas.",
      order: 3,
    },
    {
      question: "¿Dónde queda ubicada la clínica dental en Cartagena?",
      answer: "Estamos ubicados en Bocagrande, Carrera 3ra # 6-45, en zona médica accesible frente a la bahía de Cartagena de Indias.",
      order: 4,
    },
    {
      question: "¿Cuentan con parqueadero para pacientes?",
      answer: "Sí, disponemos de servicio de parqueadero vigilado gratuito para nuestros pacientes en el edificio durante el tiempo de su consulta odontológica.",
      order: 5,
    },
    {
      question: "¿Atienden emergencias odontológicas los fines de semana?",
      answer: "Atendemos los sábados de 9:00 a.m. a 1:00 p.m. Para urgencias agudas por fuera de este horario, nuestro asistente toma sus datos y la doctora de turno le contacta prioritariamente.",
      order: 6,
    },
    {
      question: "¿El blanqueamiento dental mancha o daña el esmalte de los dientes?",
      answer: "No, nuestros geles odontológicos certificados de luz LED no dañan el esmalte. Puede presentarse una leve sensibilidad pasajera durante las primeras 24 horas.",
      order: 7,
    },
    {
      question: "¿Cuánto tiempo toma el tratamiento con ortodoncia invisible?",
      answer: "Dependiendo del caso y la mordida, el tratamiento promedio toma entre 6 y 14 meses con controles periódicos y cambio de placas.",
      order: 8,
    },
    {
      question: "¿Duele el procedimiento de colocación de un implante dental?",
      answer: "El procedimiento se realiza con anestesia local de última generación y es completamente indoloro. La recuperación postoperatoria es rápida con la medicación prescrita.",
      order: 9,
    },
    {
      question: "¿Atienden niños pequeños (odontopediatría)?",
      answer: "Sí, contamos con especialistas en odontopediatría con un ambiente cálido y lúdico para que los más pequeños disfruten su visita sin ningún temor.",
      order: 10,
    },
  ];

  for (const f of faqsData) {
    const existing = await prisma.faq.findFirst({ where: { question: f.question } });
    if (!existing) {
      await prisma.faq.create({ data: f });
    }
  }

  // 6. Integraciones (inicializadas en disconnected)
  const integrationsList = [
    { id: "google_calendar", name: "Google Calendar", category: "Agendas", isConnected: false, status: "disconnected" },
    { id: "google_gmail", name: "Gmail", category: "Correo y Notificaciones", isConnected: false, status: "disconnected" },
    { id: "google_sheets", name: "Google Sheets", category: "Contactos y Hojas", isConnected: false, status: "disconnected" },
    { id: "slack", name: "Slack", category: "Comunicación de Equipo", isConnected: false, status: "disconnected" },
    { id: "stripe", name: "Stripe", category: "Pagos y Señales", isConnected: false, status: "disconnected" },
    { id: "webhooks", name: "Webhooks", category: "Automatizaciones externas", isConnected: false, status: "disconnected" },
  ];

  for (const it of integrationsList) {
    await prisma.integration.upsert({
      where: { id: it.id },
      update: {},
      create: it,
    });
  }

  // 7. Canales (WhatsApp y WebChat)
  await prisma.channelState.upsert({
    where: { id: "whatsapp" },
    update: {},
    create: {
      id: "whatsapp",
      isActive: true,
      status: "disconnected",
    },
  });

  await prisma.channelState.upsert({
    where: { id: "webchat" },
    update: {},
    create: {
      id: "webchat",
      isActive: true,
      status: "connected",
      widgetColor: "#0284c7",
      welcomeText: "¡Hola! ¿En qué podemos ayudarte hoy en Clínica Lumen?",
    },
  });

  // 8. Contactos y Conversaciones de Ejemplo
  const contact1 = await prisma.contact.upsert({
    where: { phone: "+34611223344" },
    update: {},
    create: {
      name: "Lucía Fernández",
      phone: "+34611223344",
      channel: "whatsapp",
      interest: "Blanqueamiento dental LED",
      askedAppointment: true,
    },
  });

  const conv1 = await prisma.conversation.upsert({
    where: { id: "demo-conv-1" },
    update: {},
    create: {
      id: "demo-conv-1",
      contactId: contact1.id,
      channel: "whatsapp",
      status: "bot",
      lastMessageAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  });

  const countMsgs1 = await prisma.message.count({ where: { conversationId: conv1.id } });
  if (countMsgs1 === 0) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: conv1.id,
          sender: "client",
          text: "¡Hola! Quería consultar cuánto cuesta el blanqueamiento dental y si dura mucho la sesión.",
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
        },
        {
          conversationId: conv1.id,
          sender: "assistant",
          text: "¡Hola, Lucía! Soy Sintia, asistente de Clínica Dental Lumen. Nuestro blanqueamiento dental LED en clínica tiene un precio desde 180 € y la sesión dura aproximadamente 60 minutos. ¿Te gustaría agendar una primera valoración gratuita para comprobar si es adecuado para ti?",
          toolsUsed: [
            {
              name: "consultar_servicios",
              args: { consulta: "blanqueamiento" },
              result: "Servicio encontrado: Blanqueamiento dental LED en clínica (60 min - desde 180 €)",
            },
          ],
          createdAt: new Date(Date.now() - 14 * 60 * 1000),
        },
        {
          conversationId: conv1.id,
          sender: "client",
          text: "Sí, me vendría genial un hueco para este viernes por la tarde a partir de las 17:00 si tenéis.",
          createdAt: new Date(Date.now() - 12 * 60 * 1000),
        },
      ],
    });
  }

  // Conversación 2: Con Handoff (Urgencia)
  const contact2 = await prisma.contact.upsert({
    where: { phone: "+34699887766" },
    update: {},
    create: {
      name: "Carlos Martínez",
      phone: "+34699887766",
      channel: "whatsapp",
      interest: "Urgencia dental",
      askedAppointment: false,
    },
  });

  const conv2 = await prisma.conversation.upsert({
    where: { id: "demo-conv-2" },
    update: {},
    create: {
      id: "demo-conv-2",
      contactId: contact2.id,
      channel: "whatsapp",
      status: "human_handoff",
      handoffReason: "Urgencia por dolor agudo",
      lastMessageAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  });

  const countMsgs2 = await prisma.message.count({ where: { conversationId: conv2.id } });
  if (countMsgs2 === 0) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: conv2.id,
          sender: "client",
          text: "Hola, me sacaron una muela ayer y tengo un dolor insoportable que no se me pasa con nada, ¿puedo ir ya?",
          createdAt: new Date(Date.now() - 6 * 60 * 1000),
        },
        {
          conversationId: conv2.id,
          sender: "assistant",
          text: "Siento mucho que estés con tanto dolor, Carlos. Al tratarse de una urgencia tras una extracción, acabo de pasar tu caso directamente al equipo médico de la clínica para que te atiendan de inmediato. Si lo necesitas ya mismo, puedes llamarnos directamente al 912 345 678.",
          toolsUsed: [
            {
              name: "pasar_a_humano",
              args: { motivo: "Urgencia por dolor agudo tras extracción" },
              result: "Conversación transferida al equipo",
            },
          ],
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
        },
      ],
    });
  }

  console.log("✅ Datos de demostración sembrados con éxito.");
}

async function main() {
  await seedDemoData();
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error("Error en seed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
