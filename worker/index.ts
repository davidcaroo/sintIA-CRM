import dotenv from "dotenv";
dotenv.config();

import { initWhatsAppWorker } from "./whatsapp";
import { initScheduler } from "./scheduler";

console.log("==================================================================");
console.log("🤖 SINTIA WORKER — WhatsApp Cloud API y Automatizaciones");
console.log("==================================================================");

try {
  initWhatsAppWorker();
  initScheduler();
  console.log("🚀 [Worker] Todos los servicios del worker están en ejecución.");
} catch (error) {
  console.error("❌ [Worker] Error fatal al iniciar worker:", error);
}
