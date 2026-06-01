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

MYSQL_DATABASE=bordadeiras
MYSQL_USER=bordadeiras
MYSQL_ROOT_PASSWORD=[gere senha forte]
MYSQL_PASSWORD=[gere senha forte]
DATABASE_URL=mysql://bordadeiras:SENHA_AQUI@mysql:3306/bordadeiras

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
# Mercado Pago: Admin -> Configuracoes (MySQL)
# Destinatarios WhatsApp: Admin -> WhatsApp
ADMIN_EMAIL=admin@${DOMAIN}
ADMIN_PASSWORD=[altere antes do seed]

# Webhook MP: ${LOJA_URL}/api/webhooks/mercadopago
EOF
