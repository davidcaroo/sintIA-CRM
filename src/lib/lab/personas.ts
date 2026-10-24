export interface LabPersona {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  telefonoFicticio: string;
  guion: string[];
}

export const PERSONAS: LabPersona[] = [
  {
    id: "comprador_decidido",
    nombre: "Comprador decidido (Cita directa)",
    categoria: "Venta / Agenda",
    descripcion: "Tiene clara su necesidad, pregunta por una limpieza dental y busca agendar de inmediato.",
    telefonoFicticio: "+573000000001",
    guion: [
      "Buenas tardes, quisiera saber cuánto vale una limpieza dental profunda.",
      "Excelente, ¿tienen disponibilidad para este viernes o sábado en la mañana?",
      "Perfecto, me sirve el viernes a las 10:00 AM. ¿Cómo confirmo la cita?",
    ],
  },
  {
    id: "pregunton_tarifas",
    nombre: "Preguntón de tarifas y descuentos",
    categoria: "Objeciones / Precios",
    descripcion: "Consulta precios de varios tratamientos continuos, pide descuentos y evalúa sin decidir.",
    telefonoFicticio: "+573000000002",
    guion: [
      "Hola, ¿cuánto cuesta el diseño de sonrisa?",
      "¿Y el blanqueamiento dental láser cuánto sale?",
      "Si me hago los dos, ¿me hacen algún descuento especial por paquete?",
      "Entiendo, voy a pensarlo con calma y cualquier cosa les aviso.",
    ],
  },
  {
    id: "urgencia_dolor",
    nombre: "Paciente con urgencia y dolor agudo",
    categoria: "Prioridad / Derivación",
    descripcion: "Manifiesta dolor insoportable tras un procedimiento previo. Requiere respuesta prioritaria y contacto humano.",
    telefonoFicticio: "+573000000003",
    guion: [
      "Hola, me sacaron una cordal ayer y tengo un dolor insoportable que no se me calma con nada. ¿Puedo ir de urgencia ya?",
      "No puedo esperar a mañana, el dolor es demasiado fuerte. ¿Tienen algún doctor disponible ya mismo?",
    ],
  },
  {
    id: "fuera_de_conocimiento",
    nombre: "Consulta fuera de conocimiento",
    categoria: "Seguridad / Anti-alucinación",
    descripcion: "Pregunta sobre un servicio o producto ajeno a la clínica. El asistente debe declarar que no lo ofrece sin inventar.",
    telefonoFicticio: "+573000000004",
    guion: [
      "Hola, ¿ustedes hacen duplicado de llaves de seguridad y cerrajería?",
      "¿O venden productos de ferretería industrial?",
    ],
  },
];
