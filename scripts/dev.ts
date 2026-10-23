import { spawn } from "child_process";
import path from "path";
import dotenv from "dotenv";
import { isPortOpen, waitForPort } from "./db-runner";

dotenv.config();

const isWin = process.platform === "win32";
const npxCmd = isWin ? "npx.cmd" : "npx";
const npmCmd = isWin ? "npm.cmd" : "npm";

async function run() {
  console.log("==================================================================");
  console.log("🚀 SINTIA - Entorno de Desarrollo Unificado");
  console.log("==================================================================");

  // 1. Iniciar DB Runner
  console.log("▶️ Iniciando servicio de base de datos...");
  const dbProcess = spawn(npxCmd, ["tsx", "scripts/db-runner.ts"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  // Esperar a que el puerto de la base de datos esté abierto
  const dbUrl = process.env.DATABASE_URL || "";
  const match = dbUrl.match(/@([^:]+):(\d+)\//);
  const host = match ? match[1] : "127.0.0.1";
  const port = match ? parseInt(match[2], 10) : 5433;

  try {
    await waitForPort(port, host === "localhost" ? "127.0.0.1" : host, 40);
    console.log("✅ Base de datos lista. Arrancando Web y Worker...");
  } catch (err) {
    console.error("❌ Error esperando a la base de datos:", err);
  }

  // Pequeña pausa para asegurar sincronización de esquema inicial
  await new Promise((r) => setTimeout(r, 2000));

  // 2. Iniciar Web (Next.js)
  const webProcess = spawn(npxCmd, ["next", "dev", "-p", process.env.PORT || "3000"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  // 3. Iniciar Worker
  const workerProcess = spawn(npxCmd, ["tsx", "worker/index.ts"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  const cleanup = () => {
    console.log("\n🛑 Deteniendo todos los procesos de Sintia...");
    try {
      webProcess.kill();
      workerProcess.kill();
      dbProcess.kill();
    } catch {
      // Ignorar errores al matar procesos
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  webProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.log(`[Web] Proceso finalizado con código ${code}`);
    }
  });

  workerProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.log(`[Worker] Proceso finalizado con código ${code}`);
    }
  });
}

run().catch((err) => {
  console.error("Error al arrancar Sintia:", err);
  process.exit(1);
});
