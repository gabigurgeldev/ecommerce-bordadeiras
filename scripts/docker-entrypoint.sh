#!/bin/sh
set -e

echo "[entrypoint] Starting Next.js (database via Supabase)..."
exec node server.js
