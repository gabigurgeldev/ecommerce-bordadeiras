#!/usr/bin/env bash
# Gera trecho .env de produção. Uso: ./scripts/generate-production-env.sh bordadeiras.com.br

set -euo pipefail

DOMAIN="${1:?Informe o domínio base, ex.: bordadeiras.com.br}"
LOJA_SUB="${LOJA_SUBDOMAIN:-loja}"
STORAGE_SUB="${STORAGE_SUBDOMAIN:-storage}"

LOJA_URL="https://${LOJA_SUB}.${DOMAIN}"
STORAGE_URL="https://${STORAGE_SUB}.${DOMAIN}"

cat <<EOF
# Gerado em $(date -Iseconds) — revise antes de produção
DOMAIN=${DOMAIN}
NODE_ENV=production
NEXT_PUBLIC_APP_URL=${LOJA_URL}
NEXT_PUBLIC_SITE_URL=${LOJA_URL}
AUTH_URL=${LOJA_URL}

DATABASE_URL=postgresql://postgres:SENHA_AQUI@supabase.bordadeiras.cloud:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://supabase.bordadeiras.cloud
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

REDIS_URL=redis://redis:6379

S3_ENDPOINT=http://minio:9000
S3_PUBLIC_URL=${STORAGE_URL}
S3_REGION=us-east-1
S3_BUCKET=bordadeiras-uploads
S3_ACCESS_KEY=[gere]
S3_SECRET_KEY=[gere]

WHATSAPP_SERVICE_URL=http://whatsapp-service:4001
WHATSAPP_SERVICE_SECRET=[openssl rand -base64 32]

AUTH_SECRET=[openssl rand -base64 32]
# Mercado Pago: Admin -> Configuracoes (Postgres)
# whatsapp-service: mesma DATABASE_URL + WHATSAPP_SERVICE_SECRET
# Destinatarios WhatsApp: Admin -> WhatsApp
ADMIN_EMAIL=admin@${DOMAIN}
ADMIN_PASSWORD=[altere antes do seed]

# Webhook MP: ${LOJA_URL}/api/webhooks/mercadopago
EOF
