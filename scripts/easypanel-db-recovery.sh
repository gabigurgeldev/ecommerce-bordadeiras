#!/bin/sh
# Recuperação de banco no EasyPanel (console do container da APP).
# Pré-requisito: PostgreSQL/Supabase acessível; supabase/migrations/*.sql já aplicadas.
# DATABASE_URL deve apontar para Postgres (direct, porta 5432).
#
# No painel EasyPanel, defina RUN_DB_SEED=false na app antes do restart,
# depois execute este script ou os comandos abaixo manualmente.

set -e

echo "[recovery] 1/4 — Marcar baseline Postgres como aplicada (se schema Supabase já existe)..."
npx --yes prisma@6 migrate resolve --applied 20250603130000_postgresql_baseline 2>/dev/null || {
  echo "[recovery] Tentando rolled-back + applied..."
  npx --yes prisma@6 migrate resolve --rolled-back 20250603130000_postgresql_baseline || true
  npx --yes prisma@6 migrate resolve --applied 20250603130000_postgresql_baseline
}

echo "[recovery] 2/4 — Aplicar migrations pendentes..."
npx --yes prisma@6 migrate deploy

echo "[recovery] 3/4 — Status das migrations..."
npx --yes prisma@6 migrate status

echo "[recovery] 4/4 — Seed (admin + dados de exemplo)..."
if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  if [ -f /app/prisma/seed.bundle.cjs ]; then
    node /app/prisma/seed.bundle.cjs
  else
    echo "[recovery] seed.bundle.cjs não encontrado; pule ou rode na imagem de build."
  fi
else
  echo "[recovery] RUN_DB_SEED não é true; seed ignorado (recomendado no cutover)."
fi

echo "[recovery] Concluído. Verifique GET /api/setup/status logado como admin."
