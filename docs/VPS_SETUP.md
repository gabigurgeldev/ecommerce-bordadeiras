# Deploy em VPS Hostinger + EasyPanel

Guia passo a passo para publicar o **Ecommerce Bordadeiras** em produção com Docker, domínios separados e SSL.

**Arquivos relacionados**

| Arquivo | Uso |
|---------|-----|
| `docker-compose.prod.yml` | Infra na VPS (MySQL, Redis, MinIO, WhatsApp) |
| `env.production.example` | Modelo de `.env` com URLs internas e públicas |
| `docs/ENV_REFERENCE.md` | Tabela de todas as variáveis |
| `docs/DEPLOY.md` | Checklist resumido pós-deploy |
| `scripts/generate-production-env.ps1` | Gera trecho `.env` a partir do domínio |

---

## 1. Pré-requisitos

1. **VPS Hostinger** (Ubuntu 22.04 ou 24.04 recomendado), mínimo 2 vCPU / 4 GB RAM para stack completa.
2. **Domínio** no registrador (ex.: `bordadeiras.com.br`).
3. **DNS** apontando subdomínios para o IP da VPS (registros **A** ou **AAAA**).
4. **EasyPanel** instalado na VPS ([get.easypanel.io](https://get.easypanel.io)).
5. Repositório Git clonado na VPS ou deploy via EasyPanel (GitHub/Git).

Substitua `seudominio.com.br` pelos seus domínios reais em todo o guia.

---

## 2. Plano de domínios

Preencha com seu domínio base. Exemplo com **`bordadeiras.com.br`**:

| Subdomínio | Serviço | Público? | Variáveis principais |
|------------|---------|----------|----------------------|
| `loja.bordadeiras.com.br` | Next.js (loja + `/api/*`) | Sim (HTTPS) | `NEXT_PUBLIC_APP_URL`, `AUTH_URL` |
| *(mesmo domínio da loja)* | Webhooks Mercado Pago | Sim | URL: `https://loja.../api/webhooks/mercadopago` |
| `storage.bordadeiras.com.br` | MinIO API (S3) | Sim (HTTPS) | `S3_PUBLIC_URL` |
| `console.storage...` *(opcional)* | MinIO Console | Sim, **restrinja IP** | Admin MinIO |
| `whatsapp.bordadeiras.com.br` | Baileys HTTP | Opcional | Prefira **só rede interna** |
| — | MySQL 8 | **Não** | `DATABASE_URL` → host `mysql` |
| — | Redis 7 | **Não** | `REDIS_URL` → host `redis` |

### DNS (exemplo)

| Tipo | Nome | Valor |
|------|------|-------|
| A | `loja` | `IP_DA_VPS` |
| A | `storage` | `IP_DA_VPS` |
| A | `whatsapp` | `IP_DA_VPS` *(opcional)* |

Não crie DNS público para MySQL ou Redis.

### Hostnames na rede Docker

Quando os containers estão no mesmo `docker-compose.prod.yml`, use:

```
mysql:3306
redis:6379
minio:9000
whatsapp-service:4001
app:3000
```

Rede criada pelo compose: **`bordadeiras_internal`**.

---

## 3. Instalar EasyPanel na VPS

```bash
ssh root@IP_DA_VPS
curl -sSL https://get.easypanel.io | sh
```

1. Acesse o painel (porta indicada na instalação, ex.: `http://IP:3000`).
2. Crie o projeto **`bordadeiras`**.
3. Configure firewall da VPS (ver seção 12).

---

## 4. Duas formas de deploy

### Opção A — Docker Compose na VPS (infra) + EasyPanel (app)

Recomendado para controle total da stack.

1. Clone o repositório em `/opt/bordadeiras` (ou similar).
2. `cp env.production.example .env` e edite senhas.
3. Suba infra: `docker compose -f docker-compose.prod.yml up -d`
4. No EasyPanel, crie app **Next.js** com build do Dockerfile raiz e conecte à rede Docker `bordadeiras_internal` (seção 4.3).

### Opção B — Tudo pelo EasyPanel (UI)

Crie cada serviço manualmente no painel (MySQL, Redis, MinIO, WhatsApp, App). Use as mesmas imagens/comandos do `docker-compose.prod.yml` e as variáveis de `env.production.example`.

---

## 4.1 Opção A — Compose na VPS

```bash
cd /opt/bordadeiras
git clone SEU_REPOSITORIO .
cp env.production.example .env
nano .env   # senhas, domínios, tokens MP
```

Subir **sem** a app (só infra + WhatsApp):

```bash
docker compose -f docker-compose.prod.yml up -d
```

Subir **com** a app no compose:

```bash
docker compose -f docker-compose.prod.yml --profile app up -d
```

### 4.2 Criar bucket MinIO

1. Exponha a console MinIO no EasyPanel (`storage` → porta interna `9001`) **ou** use `docker exec` temporário.
2. Login: usuário/senha = `S3_ACCESS_KEY` / `S3_SECRET_KEY` do `.env`.
3. Crie o bucket `bordadeiras-uploads` (ou o valor de `S3_BUCKET`).
4. Política: leitura pública só se necessário; o app usa URLs assinadas.

### 4.3 App no EasyPanel na mesma rede Docker

Se a app roda em container separado do compose:

```bash
docker network connect bordadeiras_internal NOME_CONTAINER_APP_EASYPANEL
```

Na app, use URLs internas da **Seção B** de `env.production.example`.

---

## 5. MySQL 8

### Via compose (`docker-compose.prod.yml`)

Já configurado com volume `mysql_data`, healthcheck e **sem** porta publicada no host.

Variáveis no `.env`:

```env
MYSQL_ROOT_PASSWORD=...
MYSQL_DATABASE=bordadeiras
MYSQL_USER=bordadeiras
MYSQL_PASSWORD=...
DATABASE_URL=mysql://bordadeiras:SENHA@mysql:3306/bordadeiras
```

### Via EasyPanel

1. **Add Service** → **MySQL** → imagem `mysql:8.4`.
2. Defina database `bordadeiras`, usuário e senhas.
3. Volume persistente obrigatório.
4. **Não** publique a porta 3306 na internet.

### Migrations e seed

**Seed automático:** a imagem da loja executa `node prisma/seed.bundle.cjs` ao iniciar (variável `RUN_DB_SEED=true` por padrão). Defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` no env **antes** do primeiro deploy.

Migrations (console da app):

```bash
npx --yes prisma@6 migrate deploy
```

Seed manual (se precisar):

```bash
node prisma/seed.bundle.cjs
```

**Login admin (`/login`):** use `ADMIN_EMAIL` e `ADMIN_PASSWORD` no **EasyPanel** (não o `.env` do PC). Diagnóstico: `GET https://loja.SEUDOMINIO/api/setup/status` — deve retornar `authSecretSet: true`, `databaseUrlSet: true`, `adminInDatabase: true`. Se `adminInDatabase` for `false`, rode `node prisma/seed.bundle.cjs` no console. Sem variáveis no painel, o bootstrap usa `admin@bordadeiras.com.br` / `Admin@123456`. Confira `AUTH_SECRET` e `AUTH_URL=https://loja.bordadeiras.com.br`.

---

## 6. Redis

### Compose

Serviço `redis`, `REDIS_URL=redis://redis:6379`, sem portas no host.

### EasyPanel

Imagem `redis:7-alpine`, volume opcional, URL interna `redis://redis:6379` (hostname = nome do serviço no painel).

**Rate limit:** com `REDIS_URL` o app usa Redis local; opcionalmente configure **Upstash** (`UPSTASH_*`) para serverless.

---

## 7. MinIO (S3)

### Compose

- API: `http://minio:9000` → `S3_ENDPOINT`
- Console: porta `9001` (proxy apenas para admins)

### EasyPanel — domínio `storage.seudominio.com.br`

1. Serviço MinIO, comando: `server /data --console-address ":9001"`.
2. **Domains** no EasyPanel:
   - `storage.seudominio.com.br` → porta **9000** (API)
   - *(opcional)* subdomínio console → **9001**
3. Ative **Let's Encrypt** no proxy do EasyPanel (Traefik/Caddy integrado).
4. No `.env` da app:

```env
S3_ENDPOINT=http://minio:9000
S3_PUBLIC_URL=https://storage.seudominio.com.br
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=bordadeiras-uploads
```

> O código usa `S3_ACCESS_KEY` / `S3_SECRET_KEY` (não `S3_ACCESS_KEY_ID`).

---

## 8. WhatsApp (Baileys)

### EasyPanel — serviço separado (código no repositório)

| Campo | Valor |
|-------|--------|
| Fonte | **Dockerfile** |
| Caminho de build | `/` (raiz do repo) |
| Arquivo Dockerfile | `services/whatsapp/Dockerfile` |
| Porta | **4001** |
| Volume persistente | `/app/data/auth` (sessão QR — **não** vai no Git) |

Variáveis no serviço **whatsapp**:

```env
DATABASE_URL=mysql://bordadeiras:SENHA@NOME_SERVICO_MYSQL:3306/bordadeiras
WHATSAPP_SERVICE_SECRET=mesmo_secret_da_app
PORT=4001
```

Na **ecommerce-app**:

```env
WHATSAPP_SERVICE_URL=http://NOME_SERVICO_WHATSAPP:4001
WHATSAPP_SERVICE_SECRET=...
```

Substitua `NOME_SERVICO_WHATSAPP` pelo nome do serviço no EasyPanel (ex.: `ecommerce_whatsapp-ecommerce`).

**Sem barra no final** em `WHATSAPP_SERVICE_URL` (evita `//session/qr` e falhas de proxy). O secret deve ser **idêntico** na app e no serviço whatsapp.

### Painel admin

1. Acesse `https://loja.seudominio.com.br/admin/whatsapp`.
2. **QR:** escaneie com o número que **envia** as mensagens.
3. **Destinatários:** cadastre manualmente os números que **recebem** alertas (salvos no MySQL).
4. **Novo número:** use “Novo número (logout)” para gerar outro QR.

### Expor `whatsapp.seudominio.com.br`?

- **Recomendado:** não expor; apenas rede interna + proxy admin na loja (`/api/admin/whatsapp/*`).

---

## 9. App Next.js

### Build

- **Dockerfile** na raiz (standalone Next.js 15).
- Porta do container: **3000**.

### Variáveis no EasyPanel (produção)

Copie de `env.production.example` — **Seções A e C**:

- URLs públicas: `https://loja.seudominio.com.br`
- URLs internas: `mysql`, `redis`, `minio`, `whatsapp-service`
- `AUTH_SECRET`, SMTP, etc.
- **Mercado Pago:** Admin → Configurações (MySQL), não variáveis `MERCADOPAGO_*` no env

### Domínio e SSL

1. EasyPanel → App → **Domains** → `loja.seudominio.com.br`.
2. Ative HTTPS (certificado automático).
3. Proxy reverso encaminha 443 → container `:3000`.

### Build args (se necessário)

Para variáveis `NEXT_PUBLIC_*`, configure-as **antes** do build no EasyPanel (são embutidas no bundle).

---

## 10. E-mail (SMTP)

### SMTP externo (recomendado)

Hostinger E-mail, SendGrid, Amazon SES, etc.:

```env
SMTP_HOST=smtp...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Bordadeiras <noreply@seudominio.com.br>"
```

### Postal self-hosted (opcional)

Descomente `postal` em `docker-compose.prod.yml` ou instale Postal como app separada no EasyPanel. Configure SPF/DKIM no DNS. Atualize também settings `mail.*` no banco via `/admin/configuracoes` se usar.

---

## 11. Integrações externas

### Mercado Pago

| Item | Valor |
|------|-------|
| Webhook URL | `https://loja.seudominio.com.br/api/webhooks/mercadopago` |
| Eventos | `payment` |
| Credenciais | Admin → **Configurações → Mercado Pago** (MySQL). Webhook secret também no painel admin. |

Não é obrigatório subdomínio `api.*` — a API fica em `/api` na mesma loja.

### Google OAuth (quando habilitado)

No [Google Cloud Console](https://console.cloud.google.com/):

| Tipo | URL |
|------|-----|
| Authorized JavaScript origins | `https://loja.seudominio.com.br` |
| Authorized redirect URIs | `https://loja.seudominio.com.br/api/auth/callback/google` |

Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

---

## 12. Firewall (VPS)

Exponha apenas HTTP/HTTPS e SSH (com IP restrito se possível):

```bash
ufw default deny incoming
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

**Não** abra `3306`, `6379`, `9000`, `4001` para `0.0.0.0` em produção.

O `docker-compose.yml` de **desenvolvimento** publica MySQL/Redis — **não** use esse arquivo em VPS pública; use `docker-compose.prod.yml`.

---

## 13. SSL/TLS

O EasyPanel gerencia certificados Let's Encrypt por domínio configurado no serviço.

| Domínio | Serviço |
|---------|---------|
| `loja.*` | App Next.js :3000 |
| `storage.*` | MinIO :9000 |
| `console.storage.*` | MinIO :9001 (opcional) |
| `whatsapp.*` | WhatsApp :4001 (evitar se possível) |

---

## 14. Labels Traefik (referência)

Se implantar compose **fora** do proxy do EasyPanel e quiser Traefik manual:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.loja.rule=Host(`loja.seudominio.com.br`)"
  - "traefik.http.services.loja.loadbalancer.server.port=3000"
```

No fluxo normal do EasyPanel, configure domínios pela **UI** — labels são opcionais.

---

## 15. Checklist pós-deploy

- [ ] DNS propagado (`dig loja.seudominio.com.br`)
- [ ] HTTPS na loja
- [ ] `npx prisma migrate deploy` sem erro
- [ ] Login admin com senha forte (pós-seed)
- [ ] Webhook Mercado Pago retorna HTTP 200
- [ ] Upload de imagem (MinIO / URL assinada)
- [ ] E-mail de teste (cadastro ou pedido)
- [ ] WhatsApp conectado (QR) e notificação de pedido teste
- [ ] MySQL/Redis **não** acessíveis de fora (`nmap IP` nas portas 3306/6379)

---

## 16. Atualizações

```bash
cd /opt/bordadeiras
git pull
docker compose -f docker-compose.prod.yml build whatsapp-service
docker compose -f docker-compose.prod.yml up -d
# Rebuild da app no EasyPanel
docker exec -it CONTAINER_APP npx prisma migrate deploy
```

---

## 17. Troubleshooting

| Sintoma | Verificação |
|---------|-------------|
| 502 na loja | Logs do container app; `DATABASE_URL` com host `mysql` |
| App não alcança MySQL | App na rede `bordadeiras_internal`? |
| Webhook MP 401 | Webhook secret em Admin → Configurações e header `x-signature` |
| Imagens quebradas | `S3_PUBLIC_URL` com HTTPS; bucket existe |
| WhatsApp 401 | `WHATSAPP_SERVICE_SECRET` igual na app e no serviço |
| QR não aparece | URL sem `/` final; logs do container whatsapp; volume `/app/data/auth`; use “Novo número (logout)” se sessão corrompida |
| WhatsApp desconecta | `POST /api/admin/whatsapp/reconnect` |

---

## 18. Exemplo `.env` (bordadeiras.com.br)

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://loja.bordadeiras.com.br
AUTH_URL=https://loja.bordadeiras.com.br

MYSQL_ROOT_PASSWORD=***
MYSQL_PASSWORD=***
DATABASE_URL=mysql://bordadeiras:***@mysql:3306/bordadeiras

REDIS_URL=redis://redis:6379

S3_ENDPOINT=http://minio:9000
S3_PUBLIC_URL=https://storage.bordadeiras.com.br
S3_BUCKET=bordadeiras-uploads
S3_ACCESS_KEY=***
S3_SECRET_KEY=***

WHATSAPP_SERVICE_URL=http://whatsapp-service:4001
WHATSAPP_SERVICE_SECRET=***

AUTH_SECRET=***
# Mercado Pago: configurar no painel admin (não colocar tokens no .env)
```

Gere um rascunho completo:

```powershell
.\scripts\generate-production-env.ps1 -Domain "bordadeiras.com.br"
```

```bash
chmod +x scripts/generate-production-env.sh
./scripts/generate-production-env.sh bordadeiras.com.br
```
