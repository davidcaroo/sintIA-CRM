import dotenv from "dotenv";
dotenv.config();

import { initWhatsAppWorker } from "./whatsapp";
import { initScheduler } from "./scheduler";

console.log("==================================================================");
console.log("🤖 SINTIA WORKER — Motor de WhatsApp y Automatizaciones");
console.log("==================================================================");

let activeSocket: any = null;

async function start() {
  try {
    activeSocket = await initWhatsAppWorker();
    initScheduler(activeSocket);
    console.log("🚀 [Worker] Todos los servicios del worker están en ejecución.");
  } catch (error) {
    console.error("❌ [Worker] Error fatal al iniciar worker:", error);
  }
}

start();

export function getActiveWhatsAppSocket() {
  return activeSocket;
}
