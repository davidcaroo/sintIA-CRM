#!/bin/sh
set -e

echo "🚀 Iniciando contenedor Sintia con comando: $1"

if [ "$1" = "web" ]; then
  echo "🔄 Aplicando migraciones de base de datos PostgreSQL..."
  npx prisma db push --skip-generate

  if [ "$SEED_DEMO" = "true" ]; then
    echo "🌱 Verificando siembra de datos de demostración..."
    npx tsx prisma/seed.ts || true
  fi

  echo "🌐 Arrancando panel web Sintia en puerto 3000..."
  exec node server.js
elif [ "$1" = "worker" ]; then
  echo "🤖 Arrancando proceso Worker de WhatsApp y automatizaciones..."
  exec npx tsx worker/index.ts
else
  exec "$@"
fi
