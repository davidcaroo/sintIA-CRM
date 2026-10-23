# ==============================================================================
# SINTIA - DOCKERFILE MULTIETAPA (STANDALONE)
# Una única imagen ligera que sirve como servicio "web" o "worker"
# ==============================================================================

# Etapa 1: Base con Node.js Alpine
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Etapa 2: Dependencias de instalación
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Etapa 3: Compilación de la aplicación
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente Prisma para entorno Linux
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Etapa 4: Imagen final de ejecución (Runner)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copiar artefactos standalone de Next.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copiar archivos necesarios para Prisma y el Worker
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

# Crear directorio para la sesión de WhatsApp
RUN mkdir -p /app/whatsapp-session && chown -R node:node /app

USER node

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["web"]
