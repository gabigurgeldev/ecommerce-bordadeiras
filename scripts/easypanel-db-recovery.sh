#!/bin/sh
# Recuperação de banco no EasyPanel (console do container da APP).
# Pré-requisito: MySQL online; env DATABASE_URL apontando para o host interno.
#
# No painel EasyPanel, defina RUN_DB_SEED=false na app antes do restart,
# depois execute este script ou os comandos abaixo manualmente.

set -e

echo "[recovery] 1/4 — Marcar foundation como aplicada (se User já existe)..."
npx --yes prisma@6 migrate resolve --applied 20250601170000_foundation 2>/dev/null || {
  echo "[recovery] Tentando rolled-back + applied..."
  npx --yes prisma@6 migrate resolve --rolled-back 20250601170000_foundation || true
  npx --yes prisma@6 migrate resolve --applied 20250601170000_foundation
}

echo "[recovery] 2/4 — Aplicar migrations pendentes..."
npx --yes prisma@6 migrate deploy

echo "[recovery] 3/4 — Seed (admin + dados de exemplo)..."
if [ -f /app/prisma/seed.bundle.cjs ]; then
  node /app/prisma/seed.bundle.cjs
else
  echo "[recovery] seed.bundle.cjs não encontrado; pule ou rode na imagem de build."
fi

echo "[recovery] 4/4 — Concluído. Verifique GET /api/setup/status logado como admin."
