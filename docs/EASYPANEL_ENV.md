# Variáveis EasyPanel — App e WhatsApp

Supabase: **https://supabase.bordadeiras.cloud**  
Chaves: **Studio → Settings → API**  
Postgres: **Studio → Database → Connection string → URI**

---

## Serviço **app** (Next.js / loja + admin)

Cole no painel **Environment** do serviço da loja (uma variável por linha).

### Obrigatórias

> **Importante:** `NEXT_PUBLIC_*` precisam existir no EasyPanel **antes do build/deploy**.  
> Sem elas o site quebra no browser. Após alterar, faça **redeploy/rebuild** da app.

```env
NODE_ENV=production

NEXT_PUBLIC_APP_URL=https://loja.SEUDOMINIO.com.br
NEXT_PUBLIC_SITE_URL=https://loja.SEUDOMINIO.com.br

NEXT_PUBLIC_SUPABASE_URL=https://supabase.bordadeiras.cloud
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...

DATABASE_URL=postgresql://postgres:SENHA_REAL@supabase.bordadeiras.cloud:5432/postgres

SUPABASE_BUCKET_PRODUCT_IMAGES=product-images
SUPABASE_BUCKET_BANNERS=banners

REDIS_URL=redis://redis:6379

WHATSAPP_SERVICE_URL=http://whatsapp-service:4001
WHATSAPP_SERVICE_SECRET=MESMO_SECRET_NOS_DOIS_SERVICOS

ADMIN_EMAIL=admin@bordadeiras.com.br
ADMIN_PASSWORD=senha-forte-do-admin
RUN_DB_SEED=false
```

### Formato de cada valor

| Variável | Formato | Onde pegar |
|----------|---------|------------|
| `DATABASE_URL` | `postgresql://postgres:SENHA@HOST:5432/postgres` | Studio → Database → URI (sem aspas) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://supabase.bordadeiras.cloud` | Studio → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JWT longo (`eyJ...`) | API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT longo (`eyJ...`) | API → `service_role` **secreto** |
| `REDIS_URL` | `redis://redis:6379` | Nome do service Redis no compose/rede Docker |
| `WHATSAPP_SERVICE_URL` | `http://whatsapp-service:4001` | Hostname interno do container WhatsApp |
| `WHATSAPP_SERVICE_SECRET` | string aleatória 32+ chars | Você define; **igual** no WhatsApp |

### Auth URLs (VPS self-hosted — não aparece no Studio)

No Studio você pode ver só **Users** / **Policies**. Configure no **`.env` do Docker do Supabase na VPS**:

`SITE_URL` + `ADDITIONAL_REDIRECT_URLS` (ver **`docs/VPS_SUPABASE_AUTH_CONFIG.md`**).

Na **app** (EasyPanel), use `NEXT_PUBLIC_APP_URL` = URL da loja.

### Opcionais (e-mail, rate limit)

```env
SMTP_HOST=smtp.seudominio.com.br
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com.br
SMTP_PASS=...
SMTP_FROM="Bordadeiras <noreply@seudominio.com.br>"

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Não usar mais na app

- `MYSQL_*`, `S3_*`, `AUTH_SECRET`, `AUTH_URL` (NextAuth removido)

Mercado Pago continua em **Admin → Configurações** (banco).

---

## Serviço **whatsapp-service**

Só precisa de **3 variáveis** (mesmo banco da loja):

```env
PORT=4001
DATABASE_URL=postgresql://postgres:SENHA_REAL@supabase.bordadeiras.cloud:5432/postgres
WHATSAPP_SERVICE_SECRET=MESMO_SECRET_DA_APP
```

| Variável | Igual à app? |
|----------|----------------|
| `DATABASE_URL` | **Sim** — mesma URI Postgres |
| `WHATSAPP_SERVICE_SECRET` | **Sim** — byte a byte |
| `NEXT_PUBLIC_*` / `SUPABASE_*` | **Não** — WhatsApp não usa |

Se o WhatsApp roda no **mesmo** `docker-compose.prod.yml`, o EasyPanel pode montar `DATABASE_URL` e `WHATSAPP_SERVICE_SECRET` do `.env` da VPS (já referenciado no compose).

---

## Rede Docker

A app no EasyPanel deve alcançar:

- `supabase.bordadeiras.cloud:5432` (Postgres)
- `redis:6379` (se Redis no compose)
- `whatsapp-service:4001` (rede interna)

```bash
docker network connect bordadeiras_internal NOME_CONTAINER_APP
```

---

## Desenvolvimento local

Arquivo principal: **`.env.local`** (Next.js `npm run dev`).

**`.env`** na raiz: mesmos `DATABASE_URL` e chaves Supabase (para `prisma generate`, `db:seed`, etc.).

```bash
npm run dev
npm run whatsapp:dev
npm run db:generate
```

Verificação: `docs/EASYPANEL_RECOVERY.md`
