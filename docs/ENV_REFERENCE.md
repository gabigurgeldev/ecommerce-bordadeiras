# Referência de variáveis de ambiente

Lista completa para desenvolvimento (`env.example`) e produção (`env.production.example`). Detalhes de deploy: [VPS_SETUP.md](./VPS_SETUP.md).

| Variável | Descrição | Exemplo produção | Onde obter |
|----------|-----------|------------------|------------|
| `NODE_ENV` | Ambiente Node/Next | `production` | Fixo em produção |
| `DOMAIN` | Domínio base (metadado) | `bordadeiras.com.br` | Seu registrador DNS |
| `NEXT_PUBLIC_APP_URL` | URL pública da loja (links, MP) | `https://loja.bordadeiras.com.br` | DNS + EasyPanel |
| `NEXT_PUBLIC_SITE_URL` | URL canônica do site | Idem `NEXT_PUBLIC_APP_URL` | Mesmo |
| `ADMIN_EMAIL` | E-mail do admin criado pelo seed | `admin@seudominio.com.br` | Você define |
| `ADMIN_PASSWORD` | Senha inicial do admin no seed | senha forte | Você define **antes** do seed |
| `NEXT_PUBLIC_SUPABASE_URL` | URL da API Supabase (client) | `https://supabase.bordadeiras.cloud` | Studio → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon/publicável | `eyJ...` | Studio → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave server-only (uploads Storage) | `eyJ...` | Studio → Settings → API |
| `SUPABASE_BUCKET_PRODUCT_IMAGES` | Bucket de fotos de produto | `product-images` | Studio → Storage (público) |
| `SUPABASE_BUCKET_BANNERS` | Bucket de banners | `banners` | Studio → Storage (público) |
| `REDIS_URL` | Redis para cache/rate limit | `redis://redis:6379` | Serviço Redis interno |
| `UPSTASH_REDIS_REST_URL` | Redis serverless (opcional) | URL Upstash | [upstash.com](https://upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | Token Upstash | token | Painel Upstash |
| `SMTP_HOST` | Servidor SMTP | `smtp.hostinger.com` | Provedor de e-mail |
| `SMTP_PORT` | Porta SMTP | `587` | Provedor |
| `SMTP_SECURE` | TLS explícito | `false` (porta 587 STARTTLS) | Provedor |
| `SMTP_USER` | Usuário SMTP | `noreply@...` | Provedor |
| `SMTP_PASS` | Senha SMTP | *** | Provedor |
| `SMTP_FROM` | Remetente exibido | `"Bordadeiras <noreply@...>"` | Você define |
| `WHATSAPP_SERVICE_URL` | Base URL do serviço Baileys | `http://whatsapp-service:4001` | Rede Docker |
| `WHATSAPP_SERVICE_SECRET` | Bearer token app → WhatsApp | string aleatória | `openssl rand -base64 32` |
| `PORT` | Porta do serviço WhatsApp | `4001` | Padrão do Dockerfile |
| `GOOGLE_CLIENT_ID` | OAuth Google (opcional) | `....apps.googleusercontent.com` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth Google (opcional) | *** | Google Cloud Console |

## Variáveis legadas/removidas

Não configure na app ou no `whatsapp-service`: `AUTH_SECRET`, `AUTH_URL`, `MYSQL_*` ou `DATABASE_URL`. A app usa Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) e Mercado Pago permanece no painel Admin.

Se uma rotina operacional legada exigir uma URI PostgreSQL direta, forneça-a apenas no job one-off/local necessário, sem colar em ambientes persistentes do EasyPanel.

## Configurações no Postgres (não usar env)

| Chave `Setting` | Uso |
|-----------------|-----|
| `mercadopago.public_key` | Chave pública MP (checkout; carregada no servidor) |
| `mercadopago.access_token` | Token privado MP (somente server) |
| `mercadopago.webhook_secret` | Validação webhook `x-signature` |
| Tabela `WhatsappRecipient` | Números que **recebem** alertas (admin → WhatsApp) |

Configure em **Admin → Configurações** (MP) e **Admin → WhatsApp** (destinatários + QR do emissor).

## Hostnames Docker (`docker-compose.prod.yml`)

| Service | Hostname na rede | Porta |
|---------|------------------|-------|
| Redis | `redis` | 6379 |
| WhatsApp | `whatsapp-service` | 4001 |
| App (perfil `app`) | `app` | 3000 |

Rede: `bordadeiras_internal`.

## Variáveis por destino

| Destino | Variáveis |
|---------|-----------|
| **App Next.js** | Seção A+C em `env.production.example` |
| **whatsapp-service** | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_SERVICE_SECRET`, `PORT` |
| **Supabase (externo)** | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_*` |
| **Somente seed** | `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
