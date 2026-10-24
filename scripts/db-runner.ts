import fs from "fs";
import path from "path";
import net from "net";
import { execSync, spawn, ChildProcess } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5433/sintia?schema=public&sslmode=disable&pgbouncer=true";
const match = dbUrl.match(/@([^:]+):(\d+)\//);
let host = match ? match[1] : "127.0.0.1";
if (host === "localhost") host = "127.0.0.1";
const port = match ? parseInt(match[2], 10) : 5433;

function isPortOpen(testPort: number, testHost: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      resolve(false);
    });
    socket.connect(testPort, testHost);
  });
}

async function waitForPort(targetPort: number, targetHost: string, maxAttempts = 60): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const open = await isPortOpen(targetPort, targetHost);
    if (open) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timeout esperando a que el puerto ${targetHost}:${targetPort} esté disponible.`);
}

let dbProcess: ChildProcess | null = null;

async function startLocalPostgres(): Promise<void> {
  const dbDir = path.resolve(process.cwd(), "data", "postgres");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  console.log(`📦 [DB] Arrancando PostgreSQL local (PGlite) en ${host}:${port}...`);

  const isWin = process.platform === "win32";
  const cmd = isWin ? "npx.cmd" : "npx";
  const args = ["pglite-server", `--db="./data/postgres"`, `--port=${port}`, `--host=${host}`, "-m", "25"];

  dbProcess = spawn(cmd, args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  dbProcess.stdout?.on("data", (data) => {
    const str = data.toString().trim();
    if (str && !str.includes("Debug level")) {
      console.log(`[PGlite] ${str}`);
    }
  });

  dbProcess.stderr?.on("data", (data) => {
    console.error(`[PGlite Error] ${data.toString().trim()}`);
  });

  dbProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.log(`[PGlite] Proceso finalizado con código ${code}`);
    }
  });

  await waitForPort(port, host);
  console.log(`✅ [DB] PostgreSQL listo en ${host}:${port}`);
}

async function runPrismaMigrationsAndSeed(): Promise<void> {
  console.log("🔄 [DB] Sincronizando tablas y esquema Prisma...");
  try {
    execSync("npx prisma db push --skip-generate", {
      stdio: "inherit",
      env: { ...process.env, PGSSLMODE: "disable" },
    });
    console.log("✅ [DB] Esquema Prisma sincronizado.");
  } catch (err) {
    console.error("❌ [DB] Error al aplicar esquema Prisma:", err);
  }

  if (process.env.SEED_DEMO === "true") {
    try {
      const { seedDemoData } = await import("../prisma/seed");
      await seedDemoData();
    } catch (err) {
      console.error("⚠️ [DB] Error al sembrar demo data:", err);
    }
  }
}

async function main() {
  const alreadyRunning = await isPortOpen(port, host);
  if (alreadyRunning) {
    console.log(`ℹ️ [DB] Conexión existente detectada en ${host}:${port}.`);
  } else {
    await startLocalPostgres();
  }

  await runPrismaMigrationsAndSeed();

  console.log("🎉 [DB] Base de datos PostgreSQL en funcionamiento continuo.");

  const cleanup = () => {
    console.log("\n🛑 [DB] Apagando PostgreSQL...");
    if (dbProcess) {
      dbProcess.kill();
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("❌ [DB] Error fatal:", err);
    process.exit(1);
  });
}

export { startLocalPostgres, waitForPort, isPortOpen };
