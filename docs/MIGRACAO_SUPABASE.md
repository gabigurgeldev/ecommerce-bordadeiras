# Plano de migração MySQL → Supabase (PostgreSQL)

> **Projeto:** Ecommerce Bordadeiras  
> **Supabase alvo:** self-hosted em `https://supabase.bordadeiras.cloud`  
> **Data do plano:** 2026-06-03

---

## 1. Resumo executivo

O ecommerce é uma **Next.js 15 App Router** com **Prisma 6 + MySQL 8**, autenticação **NextAuth v5 (JWT + Credentials)**, pagamentos **Mercado Pago** (não Stripe), armazenamento **MinIO (S3-compatible)** e serviço auxiliar **WhatsApp (Baileys)** que também usa Prisma.

A migração para Supabase significa:

1. Trocar o provider Prisma de `mysql` para `postgresql`
2. Aplicar o schema Postgres em `supabase/migrations/` (já criado neste repositório)
3. Migrar dados do MySQL para Postgres
4. Atualizar `DATABASE_URL` na app, no serviço WhatsApp e no deploy (EasyPanel/Docker)
5. **Manter** NextAuth com JWT no curto prazo (sem migrar para Supabase Auth na fase inicial)
6. **Opcional (fases posteriores):** Supabase Storage no lugar de MinIO; Supabase Auth; políticas RLS granulares

**Escopo desta entrega:** plano + migrations SQL. Refatoração da aplicação fica nas fases 3–5.

---

## 2. Inventário do estado atual

### 2.1 Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend/API | Next.js 15, React 19, TypeScript |
| ORM | Prisma 6.5 (`@prisma/client`) |
| Banco | MySQL 8.4 (Docker / EasyPanel) |
| Auth | NextAuth 5 beta, strategy `jwt`, provider Credentials |
| Cache/rate-limit | Redis (`ioredis` + opcional Upstash) |
| Storage | MinIO via `@aws-sdk/client-s3` |
| Pagamentos | Mercado Pago (`mercadopago` SDK) |
| E-mail | Nodemailer + SMTP |
| WhatsApp | Serviço Node separado em `services/whatsapp/` |

### 2.2 Tabelas (28 modelos Prisma)

**Auth:** `User`, `Account`, `VerificationToken`, `PasswordResetToken`  
**Endereços:** `Address`  
**Catálogo:** `Category`, `Product`, `ProductImage`  
**Pedidos:** `Coupon`, `Order`, `OrderItem`, `Payment`, `Tracking`  
**Blog:** `BlogCategory`, `BlogTag`, `BlogPost`, `BlogPostTag`  
**Plataforma:** `Notification`, `EmailTemplate`, `Setting`, `StorefrontBanner`, `StorefrontTrustItem`, `WhatsappRecipient`, `WhatsappSession`, `AuditLog`

**Enums (9):** `Role`, `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `ProductStatus`, `CouponType`, `NotificationType`, `TrackingStatus`, `AuditAction`

### 2.3 Migrations Prisma

| Local | Conteúdo |
|-------|----------|
| `prisma/migrations/_archive_mysql/*` | Histórico MySQL (não executar em Postgres) |
| `prisma/migrations/20250603130000_postgresql_baseline` | Baseline no-op; marcar com `db:migrate:baseline` |
| `supabase/migrations/*.sql` | DDL canônico no Supabase |

### 2.4 Variáveis de ambiente (MySQL)

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Prisma (app + whatsapp-service) |
| `MYSQL_ROOT_PASSWORD` | Docker MySQL |
| `MYSQL_DATABASE` | Nome do banco (`bordadeiras`) |
| `MYSQL_USER` / `MYSQL_PASSWORD` | Usuário app |

Ver também: `.env.example`, `env.production.example`, `docs/ENV_REFERENCE.md`.

### 2.5 Auth atual

- `src/auth.ts`: NextAuth com **JWT** (não usa sessões em banco)
- `@auth/prisma-adapter` está no `package.json` mas **não** está wired no auth principal
- Senhas: `bcryptjs` em `User.passwordHash`
- Verificação de e-mail: `User.emailVerified`
- Reset de senha: tabela `PasswordResetToken`
- Roles: `User.role` (`USER` | `ADMIN`)

### 2.6 Storage

- `src/lib/storage.ts`: S3/MinIO (presigned URLs, upload direto)
- URLs salvas em `ProductImage.url`, `StorefrontBanner.imageUrl`, `Product.images` (JSON legado)
- **Não** há blobs no MySQL — migração de arquivos é separada (MinIO → Supabase Storage, fase opcional)

### 2.7 Integrações com DB

| Integração | Arquivo(s) | Notas |
|------------|------------|-------|
| Mercado Pago webhook | `src/app/api/webhooks/mercadopago/route.ts` | Atualiza `Payment`, dispara `onOrderPaid` |
| Mercado Pago config | `Setting` table via admin | Tokens salvos no banco |
| Pedidos API | `src/app/api/orders/route.ts` | CRUD Prisma |
| WhatsApp service | `services/whatsapp/src/db.ts` | `WhatsappSession`, `WhatsappRecipient` |

**Stripe:** não utilizado neste projeto.

### 2.6 Arquivos que importam Prisma (~35)

Actions admin, data layer, webhooks, auth helpers, bootstrap, checkout — ver grep `from "@/lib/prisma"`.

---

## 3. Arquitetura alvo

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Next.js App    │────▶│  Prisma (PG)     │────▶│ Supabase Postgres│
│  (EasyPanel)    │     │  service_role    │     │ self-hosted VPS  │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ├── Redis (rate limit / cache webhook)
         ├── MinIO ou Supabase Storage (fase opcional)
         └── WhatsApp service → mesmo DATABASE_URL Postgres
```

### Decisões recomendadas

| Componente | Fase 1 (cutover) | Fase futura |
|------------|------------------|-------------|
| Banco | Supabase Postgres via Prisma | — |
| Auth | Manter NextAuth + JWT | Migrar para Supabase Auth OU sync `auth.users` |
| RLS | Habilitado, sem policies públicas (baseline) | Policies por tabela se usar `supabase-js` no client |
| Storage | Manter MinIO | Migrar bucket para Supabase Storage |
| Realtime | Não usado | Notificações de pedido |

---

## 4. Roadmap por fases

### Fase 0 — Preparação (1–2 dias)

- [ ] Confirmar `project_ref` do Supabase self-hosted (20 caracteres)
- [ ] Configurar MCP Cursor apontando para `https://supabase.bordadeiras.cloud/mcp` **sem** `read_only=true` para DDL
- [ ] Backup completo MySQL (`mysqldump`)
- [ ] Documentar `DATABASE_URL` Postgres (pooler vs direct — Prisma migrate precisa de conexão direct, porta 5432)
- [ ] Staging: clone do banco + app apontando para Supabase de teste

### Fase 1 — Schema Postgres (este PR)

- [x] Criar `supabase/migrations/*.sql` (4 arquivos)
- [x] Aplicar no Supabase self-hosted via MCP ou CLI (confirmado no servidor)
- [ ] Validar: `\dt` / `list_tables` — 28 tabelas + enums

### Fase 2 — Migração de dados

1. Export MySQL: `mysqldump --compatible=postgresql` ou ferramenta (pgloader, AWS DMS, script custom)
2. Transformações necessárias:
   - JSON → JSONB (automático na carga)
   - `DATETIME(3)` → `TIMESTAMP(3)` (timezone: definir UTC)
   - Enums: valores idênticos (case-sensitive)
   - `TINYINT(1)` boolean → já mapeado
3. Ordem de carga respeitando FKs (User → Address → Product → Order → …)
4. Re-seed se ambiente vazio: `pnpm db:seed` após trocar provider

### Fase 3 — Código da aplicação

1. **`prisma/schema.prisma`** — [x] `provider = "postgresql"`
2. Regenerar client: `pnpm db:generate` (ou `npx --yes prisma@6 generate`) — [x] no repo
3. Baseline Prisma (implementado no repo):
   - [x] Migrations MySQL antigas em `prisma/migrations/_archive_mysql/` (somente histórico)
   - [x] Baseline Postgres ativa: `20250603130000_postgresql_baseline` (no-op; DDL em `supabase/migrations/`)
   - [ ] Após Supabase SQL aplicado: `pnpm db:migrate:baseline` ou `npx --yes prisma@6 migrate resolve --applied 20250603130000_postgresql_baseline` (rodar no VPS/EasyPanel)
   - Ver `prisma/migrations/_archive_mysql/README.md`
4. [x] Atualizar mensagens: `src/lib/data/db-available.ts` ("PostgreSQL/Supabase" em vez de MySQL)
5. [x] **`docker-compose.prod.yml`:** service `mysql` removido
6. [x] **`services/whatsapp/`:** mesma `DATABASE_URL` Postgres (env examples)
7. [ ] Testar: login, checkout, webhook MP (sandbox), admin CRUD

### Fase 4 — Auth (opcional / incremental)

**Opção conservadora (recomendada no cutover):** manter NextAuth + tabela `User` custom.

**Opção Supabase Auth (depois):**
- Criar trigger sync `auth.users` → `"User"`
- Migrar senhas **não** é trivial (bcrypt vs Supabase) — exigir reset ou manter Credentials contra `"User"`
- Mapear `role` em `app_metadata` (nunca `user_metadata` para autorização)

### Fase 5 — Cutover produção

1. Modo manutenção / pausar webhooks MP
2. Sync final MySQL → Postgres
3. Trocar `DATABASE_URL` no EasyPanel
4. Deploy app + whatsapp-service
5. Smoke tests + reativar webhooks
6. Monitorar logs 24–48h
7. Desligar MySQL após período de rollback

---

## 5. Mapeamento MySQL → PostgreSQL

| MySQL | PostgreSQL | Notas |
|-------|------------|-------|
| `VARCHAR(191)` | `TEXT` | Prisma Postgres default |
| `TEXT` / `LONGTEXT` | `TEXT` | Sem limite prático |
| `DATETIME(3)` | `TIMESTAMP(3)` | Prisma `@default(now())` |
| `JSON` | `JSONB` | Preferir JSONB no PG |
| `ENUM(...)` | `CREATE TYPE ... AS ENUM` | Nomes iguais ao Prisma |
| `BOOLEAN` | `BOOLEAN` | Idêntico |
| `INTEGER` | `INTEGER` | Idêntico |
| `` `Order` `` | `"Order"` | Palavra reservada — aspas obrigatórias |
| `@default(cuid())` | App/Prisma gera | IDs existentes preservados na migração de dados |
| `utf8mb4_unicode_ci` | `UTF8` default PG | Sem conversão extra |

---

## 6. Alterações de código (por módulo)

### Config / infra

| Arquivo | Alteração |
|---------|-----------|
| `prisma/schema.prisma` | `provider = "postgresql"` |
| `.env.example` | `DATABASE_URL=postgresql://...` |
| `env.production.example` | Remover `MYSQL_*`, adicionar Supabase vars |
| `docker-compose.prod.yml` | Remover `mysql` service; `depends_on` postgres externo |
| `docs/*.md` | Referências MySQL → Supabase |

### Core DB

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/prisma.ts` | Sem mudança estrutural |
| `src/lib/data/db-available.ts` | Mensagem de erro |

### Auth (fase 3 — mínimo)

| Arquivo | Alteração |
|---------|-----------|
| `src/auth.ts` | Sem mudança no cutover |
| `src/lib/verify-credentials.ts` | Sem mudança |
| `src/actions/auth/*` | Sem mudança |

### Admin / storefront (sem mudança de query)

Todos os arquivos em `src/actions/admin/*`, `src/lib/data/*`, `src/app/api/*` continuam via Prisma — **compatíveis após troca de provider**.

### WhatsApp

| Arquivo | Alteração |
|---------|-----------|
| `services/whatsapp/src/db.ts` | Apenas `DATABASE_URL` |
| `services/whatsapp/Dockerfile` | `prisma generate` com PG |

### Storage (fase opcional posterior)

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/storage.ts` | Adapter Supabase Storage OU manter MinIO |
| `src/app/api/uploads/*` | Ajustar URLs |

---

## 7. Tabela de variáveis de ambiente

| Antiga (MySQL) | Nova (Supabase) | Onde |
|----------------|-----------------|------|
| `DATABASE_URL=mysql://user:pass@mysql:3306/bordadeiras` | `DATABASE_URL=postgresql://postgres.[ref]:[pass]@db.[ref].supabase.bordadeiras.cloud:5432/postgres` | App, WhatsApp |
| `MYSQL_ROOT_PASSWORD` | *(remover)* | — |
| `MYSQL_DATABASE` | *(remover)* | — |
| `MYSQL_USER` / `MYSQL_PASSWORD` | *(remover)* | — |
| — | `NEXT_PUBLIC_SUPABASE_URL=https://supabase.bordadeiras.cloud` | Fase client (opcional) |
| — | `NEXT_PUBLIC_SUPABASE_ANON_KEY=...` | Fase client (opcional) |
| — | `SUPABASE_SERVICE_ROLE_KEY=...` | Server-only, nunca `NEXT_PUBLIC_` |

**Self-hosted:** obter keys no Studio → Settings → API. Connection string em Database → Connection string → URI.

**Prisma + Supabase pooler:** use `?pgbouncer=true` na URL de runtime; migrations usam conexão **direct** (porta 5432, sem pooler).

---

## 8. RLS e segurança

Migration `20250603120000_rls_baseline.sql`:

- **RLS habilitado** em todas as 28 tabelas
- **Sem policies** para `anon`/`authenticated` → acesso via PostgREST bloqueado
- Prisma com usuário `postgres` ou `service_role` **bypassa RLS** — comportamento esperado no cutover

Recomendações futuras:

| Tabela | Policy sugerida |
|--------|-----------------|
| `Product`, `Category` | SELECT público onde `active = true` |
| `Order`, `Address` | SELECT/INSERT só `auth.uid() = userId` |
| `Setting`, `AuditLog` | Somente service_role |
| `WhatsappSession` | Somente service_role |
| Views | `SECURITY INVOKER` (Postgres 15+) |

Checklist Supabase (skill):

- Nunca autorizar via `user_metadata`
- `service_role` nunca no browser
- UPDATE exige policy SELECT correspondente

---

## 9. Estratégia de rollback

1. Manter MySQL rodando 7–14 dias pós-cutover (somente leitura)
2. Snapshot Postgres antes do cutover
3. Se falha crítica: reverter `DATABASE_URL` para MySQL, redeploy versão anterior
4. Webhooks MP: idempotência via Redis (`mp:webhook:*`) reduz duplicatas ao reprocessar

---

## 10. Riscos

| Risco | Mitigação |
|-------|-----------|
| MCP read-only impede DDL | Remover flag ou usar CLI/`psql` |
| MCP conectado ao Cloud errado | Verificar URL do MCP; usar project_ref do self-hosted |
| Downtime na migração de dados | Janela de manutenção + sync incremental |
| Timezone em timestamps | Normalizar UTC na exportação |
| Prisma 7 vs 6 | Sempre `npx --yes prisma@6` (ver `docs/EASYPANEL_RECOVERY.md`) |
| WhatsApp session JSON grande | Testar insert JSONB em `WhatsappSession` |
| Order reserved word | Migrations usam `"Order"` quoted |

---

## 11. Checklist de testes

- [ ] `pnpm db:generate && pnpm build`
- [ ] Registro + login + logout
- [ ] Admin: produtos, categorias, cupons, banners
- [ ] Checkout guest + logged-in
- [ ] Webhook Mercado Pago (sandbox): pagamento aprovado → `Order` PAID
- [ ] E-mail transacional
- [ ] WhatsApp: conectar sessão + notificação de pedido
- [ ] Upload imagem produto/banner (MinIO)
- [ ] Blog público
- [ ] Rate limit login/webhook
- [ ] Seed produção (`db:seed:prod`)

---

## 12. Migrations criadas neste repositório

```
supabase/migrations/
├── 20250601170000_foundation.sql      # 25 tabelas + 9 enums + FKs
├── 20250602180000_storefront_banner.sql
├── 20250602190000_storefront_trust_item.sql
└── 20250603120000_rls_baseline.sql    # RLS enable-only
```

### Aplicar no Supabase self-hosted

**Via MCP** (Cursor, write enabled):
```
apply_migration(name=foundation, query=<conteúdo do arquivo>)
```

**Via CLI** na VPS:
```bash
cd /path/to/ecommerce-bordadeiras
supabase link --project-ref <REF_20_CHARS>
supabase db push
```

**Via psql:**
```bash
psql "$DATABASE_URL" -f supabase/migrations/20250601170000_foundation.sql
# repetir para cada arquivo em ordem
```

---

## 13. Próximos passos imediatos

1. Autenticar MCP contra `supabase.bordadeiras.cloud` (OAuth) e obter `project_ref`
2. Remover `read_only=true` da URL MCP para permitir DDL
3. Executar `list_tables` — confirmar banco vazio ou sem conflito
4. Aplicar as 4 migrations em ordem
5. Atualizar `prisma/schema.prisma` → `postgresql` e validar `prisma db pull` vs schema manual
6. Planejar janela de migração de dados (Fase 2)

---

## 14. MCP Supabase VPS (Cursor)

### Configuração do projeto

Arquivo: **`.cursor/mcp.json`** (escopo deste repositório).

Arquivo **`.cursor/mcp.json`** (já criado neste repo):

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://supabase.bordadeiras.cloud/mcp?read_only=true&features=docs%2Cdatabase%2Cdebugging%2Cdevelopment"
    }
  }
}
```

Se o plugin **Supabase Cloud** (`plugin-supabase-supabase`) conflitar com o nome `supabase`, desative o plugin neste workspace ou renomeie o servidor no `mcp.json` (ex.: `supabase-vps`).

### Como ativar no Cursor

1. Abra **Cursor Settings → MCP** (ou recarregue servidores MCP após salvar `.cursor/mcp.json`).
2. Confirme que o servidor aponta para **`supabase.bordadeiras.cloud`** (não `mcp.supabase.com`).
3. Clique para **autenticar (OAuth)** contra `supabase.bordadeiras.cloud` — sem OAuth a URL retorna **403**.
4. Teste no agente: `list_projects`, `get_project_url`, `list_tables` via servidor **`supabase`**.

### URL recomendada para aplicar migrations (DDL)

Remova `read_only=true` antes de `apply_migration` ou `execute_sql` com DDL:

```json
"supabase": {
  "url": "https://supabase.bordadeiras.cloud/mcp?features=docs%2Cdatabase%2Cdebugging%2Cdevelopment"
}
```

Com `read_only=true`, **`apply_migration` e DDL via `execute_sql` falham** — use apenas consultas/leitura ou aplique SQL por CLI/`psql`.

Não use `read_only=true` ao aplicar migrations. O OAuth deve estar vinculado à instância **self-hosted**, não à conta Supabase Cloud.

### Registro acidental no projeto Cloud "Votaris"

Durante o diagnóstico do MCP, foi gravada uma migration de teste (`foundation_ecommerce_test`) no projeto Cloud **Votaris** (`emvvclqarqfvwenbxbno`). Isso **não** afeta o ecommerce. Se quiser limpar: Supabase Dashboard → projeto Votaris → Database → Migrations → remover a entrada de teste (ou ignorar).

### Aplicar migrations sem MCP

Enquanto o MCP não apontar para `supabase.bordadeiras.cloud`, use `psql` ou `supabase db push` na VPS com os arquivos em `supabase/migrations/` (ordem cronológica dos timestamps no nome do arquivo).
