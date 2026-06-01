# Referência de variáveis de ambiente

Lista completa para desenvolvimento (`env.example`) e produção (`env.production.example`). Detalhes de deploy: [VPS_SETUP.md](./VPS_SETUP.md).

| Variável | Descrição | Exemplo produção | Onde obter |
|----------|-----------|------------------|------------|
| `NODE_ENV` | Ambiente Node/Next | `production` | Fixo em produção |
| `DOMAIN` | Domínio base (metadado) | `bordadeiras.com.br` | Seu registrador DNS |
| `NEXT_PUBLIC_APP_URL` | URL pública da loja (links, MP) | `https://loja.bordadeiras.com.br` | DNS + EasyPanel |
| `NEXT_PUBLIC_SITE_URL` | URL canônica do site | Idem `NEXT_PUBLIC_APP_URL` | Mesmo |
| `AUTH_URL` | URL base NextAuth | Idem loja | Mesmo |
| `AUTH_SECRET` | Segredo de sessão JWT/cookies | string 32+ chars | `openssl rand -base64 32` |
| `ADMIN_EMAIL` | E-mail do admin (seed + fallback) | `admin@bordadeiras.com.br` | Você define |
| `ADMIN_PASSWORD` | Senha inicial do admin no seed | senha forte | Você define **antes** do seed |
| `DATABASE_URL` | Conexão Prisma MySQL | `mysql://bordadeiras:***@mysql:3306/bordadeiras` | Compose/EasyPanel MySQL |
| `MYSQL_ROOT_PASSWORD` | Senha root MySQL | senha forte | Você define no serviço MySQL |
| `MYSQL_DATABASE` | Nome do banco | `bordadeiras` | Padrão do projeto |
| `MYSQL_USER` | Usuário da aplicação | `bordadeiras` | Padrão do projeto |
| `MYSQL_PASSWORD` | Senha do usuário app | senha forte | Mesmo valor em `DATABASE_URL` |
| `REDIS_URL` | Redis para cache/rate limit | `redis://redis:6379` | Serviço Redis interno |
| `UPSTASH_REDIS_REST_URL` | Redis serverless (opcional) | URL Upstash | [upstash.com](https://upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | Token Upstash | token | Painel Upstash |
| `SMTP_HOST` | Servidor SMTP | `smtp.hostinger.com` | Provedor de e-mail |
| `SMTP_PORT` | Porta SMTP | `587` | Provedor |
| `SMTP_SECURE` | TLS explícito | `false` (porta 587 STARTTLS) | Provedor |
| `SMTP_USER` | Usuário SMTP | `noreply@...` | Provedor |
| `SMTP_PASS` | Senha SMTP | *** | Provedor |
| `SMTP_FROM` | Remetente exibido | `"Bordadeiras <noreply@...>"` | Você define |
| `S3_ENDPOINT` | API S3 **interna** | `http://minio:9000` | Rede Docker `minio` |
| `S3_REGION` | Região S3 (MinIO aceita qualquer) | `us-east-1` | Padrão |
| `S3_BUCKET` | Bucket de uploads | `bordadeiras-uploads` | Criar no MinIO |
| `S3_ACCESS_KEY` | Access key MinIO | usuário gerado | MinIO root ou IAM |
| `S3_SECRET_KEY` | Secret key MinIO | *** | MinIO |
| `S3_PUBLIC_URL` | URL pública dos arquivos | `https://storage.bordadeiras.com.br` | DNS + proxy MinIO |
| `WHATSAPP_SERVICE_URL` | Base URL do serviço Baileys | `http://whatsapp-service:4001` | Rede Docker |
| `WHATSAPP_SERVICE_SECRET` | Bearer token app → WhatsApp | string aleatória | `openssl rand -base64 32` |
| `PORT` | Porta do serviço WhatsApp | `4001` | Padrão do Dockerfile |
| `GOOGLE_CLIENT_ID` | OAuth Google (opcional) | `....apps.googleusercontent.com` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth Google (opcional) | *** | Google Cloud Console |

## Configurações no MySQL (não usar env)

| Chave `Setting` | Uso |
|-----------------|-----|
| `mercadopago.public_key` | Chave pública MP (checkout; carregada no servidor) |
| `mercadopago.access_token` | Token privado MP (somente server) |
| `mercadopago.webhook_secret` | Validação webhook `x-signature` |
| Tabela `WhatsappRecipient` | Números que **recebem** alertas (admin → WhatsApp) |

Configure em **Admin → Configurações** (MP) e **Admin → WhatsApp** (destinatários + QR do emissor).

## Aliases e inconsistências

| Arquivo | Nome usado | Código real |
|---------|------------|-------------|
| `env.example` | `S3_ACCESS_KEY_ID` | Use `S3_ACCESS_KEY` (`src/lib/storage.ts`) |
| `env.example` | `WHATSAPP_SERVICE_URL=...3001` | Container usa porta **4001** |

## Hostnames Docker (`docker-compose.prod.yml`)

| Service | Hostname na rede | Porta |
|---------|------------------|-------|
| MySQL | `mysql` | 3306 |
| Redis | `redis` | 6379 |
| MinIO API | `minio` | 9000 |
| MinIO Console | `minio` | 9001 |
| WhatsApp | `whatsapp-service` | 4001 |
| App (perfil `app`) | `app` | 3000 |

Rede: `bordadeiras_internal`.

## Variáveis por destino

| Destino | Variáveis |
|---------|-----------|
| **App Next.js** | Seção A+C em `env.production.example` |
| **whatsapp-service** | `DATABASE_URL`, `WHATSAPP_*`, `PORT` |
| **MinIO container** | `S3_ACCESS_KEY`, `S3_SECRET_KEY` → `MINIO_ROOT_*` |
| **MySQL container** | `MYSQL_*` |
| **Somente seed** | `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
