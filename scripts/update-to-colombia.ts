import { db } from "../src/lib/db";

async function updateToColombia() {
  console.log("🇨🇴 Actualizando configuración de Sintia a Cartagena de Indias, Colombia...");

  await db.businessInfo.updateMany({
    data: {
      address: "Bocagrande, Carrera 3ra # 6-45, Cartagena de Indias, Bolívar, Colombia",
      phone: "+57 300 912 3456",
      website: "https://clinicalumen.co",
      timezone: "America/Bogota",
    },
  });

  await db.assistantConfig.updateMany({
    data: {
      welcomeMessage: "¡Hola! Soy Sintia, asistente de Clínica Dental Lumen en Cartagena de Indias. ¿En qué le puedo colaborar hoy?",
      customInstructions: "Atiende con amabilidad, calidez y cortesía en español de Colombia (Cartagena de Indias). Trata a los pacientes de usted con respeto («con mucho gusto», «un placer colaborarle»). Tu objetivo es orientar sobre tratamientos dentales y coordinar citas en la clínica en horario de Colombia (America/Bogota).",
      neverDoRules: "- Nunca des diagnósticos médicos ni formules medicamentos.\n- Nunca inventes precios o tratamientos que no estén en el catálogo oficial.\n- Nunca prometas resultados clínicos garantizados al 100%.\n- Ante cualquier dolor agudo, flemón, hemorragia o traumatismo severo, avisa de que es una urgencia, transfiere la conversación a una persona y facilita la línea directa +57 300 912 3456.",
      handoffCustomRule: "Si el paciente solicita hablar con la dirección médica o manifiesta inconformidad con un procedimiento previo.",
    },
  });

  // Actualizar precios de servicios a Pesos Colombianos (COP)
  const serviceUpdates = [
    { name: "Primera visita y revisión diagnóstica", price: 0, deposit: 0 },
    { name: "Limpieza dental con ultrasonidos", price: 120000, deposit: 30000 },
    { name: "Blanqueamiento dental LED", price: 450000, deposit: 100000 },
    { name: "Empaste estético (Obturación composite)", price: 150000, deposit: 40000 },
    { name: "Endodoncia unirradicular", price: 380000, deposit: 80000 },
    { name: "Extracción dental simple", price: 110000, deposit: 30000 },
    { name: "Implante dental de titanio", price: 1950000, deposit: 200000 },
    { name: "Ortodoncia invisible (Invisalign)", price: 3200000, deposit: 300000 },
  ];

  for (const s of serviceUpdates) {
    await db.service.updateMany({
      where: { name: { contains: s.name.slice(0, 15) } },
      data: {
        price: s.price,
        stripeDeposit: s.deposit,
      },
    });
  }

  // Actualizar FAQs a contexto local de Cartagena
  await db.faq.updateMany({
    where: { question: { contains: "Aparcamiento" } },
    data: {
      question: "¿Tienen parqueadero para pacientes?",
      answer: "Sí, contamos con parqueadero vigilado para pacientes en el Edificio Centro Ejecutivo Bocagrande, con la primera hora de cortesía.",
    },
  });

  await db.faq.updateMany({
    where: { question: { contains: "Mutuas" } },
    data: {
      question: "¿Atienden pólizas de salud y medicina prepagada?",
      answer: "Atendemos pacientes particulares y convenios de reembolso con aseguradoras como Colmédica, Sura, Coomeva y Seguros Bolívar.",
    },
  });

  console.log("✅ Configuración actualizada con éxito a Cartagena de Indias, Bolívar, Colombia (America/Bogota).");
  process.exit(0);
}

updateToColombia().catch((err) => {
  console.error("Error actualizando a Colombia:", err);
  process.exit(1);
});
