import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["@whiskeysockets/baileys", "pino", "@electric-sql/pglite", "pg"],
};

export default nextConfig;
