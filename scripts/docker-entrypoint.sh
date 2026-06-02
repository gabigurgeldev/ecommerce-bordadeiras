#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations..."
if npx --yes prisma@6 migrate deploy; then
  echo "[entrypoint] Migrations applied."
else
  echo "[entrypoint] WARNING: migrate deploy failed — check DATABASE_URL and migration history."
fi

# Seed idempotente (upsert) — desative com RUN_DB_SEED=false
if [ "${RUN_DB_SEED:-true}" != "false" ] && [ -f /app/prisma/seed.bundle.cjs ]; then
  echo "[entrypoint] Running database seed..."
  node /app/prisma/seed.bundle.cjs || echo "[entrypoint] WARNING: seed failed."
fi

echo "[entrypoint] Starting Next.js..."
exec node server.js
