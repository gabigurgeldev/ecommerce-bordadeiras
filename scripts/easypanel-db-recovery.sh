#!/bin/sh
# Recuperação de banco no EasyPanel (console do container da APP).
# Pré-requisito: migrations em supabase/migrations/ aplicadas no projeto Supabase.
#
# Use Supabase CLI ou SQL Editor no dashboard para aplicar migrations pendentes.
# Verifique conectividade: node scripts/test-db-connection.mjs

set -e

echo "[recovery] Apply pending SQL from supabase/migrations/ via Supabase dashboard or CLI."
echo "[recovery] Example: supabase db push (with project linked)"
echo "[recovery] Then verify: GET /api/setup/status (admin) or node scripts/test-db-connection.mjs"
echo "[recovery] Concluído."
