#!/bin/sh
set -e

# Seed idempotente (upsert) — desative com RUN_DB_SEED=false
if [ "${RUN_DB_SEED:-true}" != "false" ] && [ -f /app/prisma/seed.bundle.cjs ]; then
  echo "[entrypoint] Running database seed..."
  node /app/prisma/seed.bundle.cjs || echo "[entrypoint] Seed warning (continuing startup)"
fi

echo "[entrypoint] Starting Next.js..."
exec node server.js
