# Execução de cutover — MySQL → Supabase (PostgreSQL)

> **Projeto:** Ecommerce Bordadeiras  
> **Supabase:** `https://supabase.bordadeiras.cloud`  
> **Relacionado:** `docs/MIGRACAO_SUPABASE.md` (estratégia) · **Fase 2:** `docs/FASE2_SUPABASE_COMPLETO.md` (Auth + Storage + RLS)

## Status do repositório (atualizado 2026-06-03)

| Item | Status |
|------|--------|
| `supabase/migrations/*.sql` aplicadas no servidor | ✅ (confirmado) |
| `prisma/schema.prisma` → `postgresql` | ✅ |
| Migrations MySQL arquivadas em `prisma/migrations/_archive_mysql/` | ✅ |
| Track Prisma ativa só `20250603130000_postgresql_baseline` | ✅ |
| `docker-compose.prod.yml` sem MySQL | ✅ |
| `.env.example` / `env.production.example` Postgres + Supabase | ✅ |
| Mensagens UI Postgres (`db-available.ts`, admin layout) | ✅ |
| Runtime paths (`src/`, `scripts/`, compose, env examples) sem MySQL | ✅ |
| `scripts/easypanel-db-recovery.sh` fluxo Postgres baseline | ✅ |
| `npm run build` local | ✅ (exit 0) |
| `npx prisma@6 validate` com `.env` local (MySQL) | ⬜ bloqueado — `.env` ainda `mysql://` |
| `migrate resolve` + `migrate deploy` no Postgres | ⬜ rodar no EasyPanel/VPS |
| Dados MySQL → Postgres em produção | ⬜ ver `scripts/migrate-mysql-to-postgres.md` |
| Atualizar `.env` / `.env.local` local para Postgres | ⬜ opcional (dev) |
| Smoke tests produção (login, checkout, MP, WhatsApp) | ⬜ pós-deploy |

---

## Risco crítico antes do deploy

O **entrypoint** (`scripts/docker-entrypoint.sh`) executa `prisma migrate deploy`. Com o estado atual do repo, só existe a migration **baseline** (`SELECT 1`) — seguro **se** o histórico `_prisma_migrations` no Postgres estiver alinhado.

**Antes do redeploy em produção:**

```bash
npx --yes prisma@6 migrate resolve --applied 20250603130000_postgresql_baseline
npx --yes prisma@6 migrate deploy
npx --yes prisma@6 migrate status
```

Não rode `migrate deploy` em banco vazio sem antes aplicar `supabase/migrations/*.sql`.

---

## Ordem de execução

1. **Dados** — export MySQL → import Postgres (preservar `id`, enums, `"Order"`). Guia: `scripts/migrate-mysql-to-postgres.md`.
2. **Env EasyPanel** — `DATABASE_URL=postgresql://...` na app e no WhatsApp; `RUN_DB_SEED=false` no cutover.
3. **`migrate resolve`** — comando acima no ambiente alvo.
4. **Build + redeploy** — imagens app e `services/whatsapp`.
5. **Smoke tests** — login admin, checkout, webhook MP, upload MinIO, WhatsApp.
6. **Rollback** — manter MySQL read-only 7–14 dias; reverter `DATABASE_URL` se necessário.

---

## Variáveis de ambiente

| Remover | Usar |
|---------|------|
| `MYSQL_*` | — |
| `mysql://...` | `postgresql://postgres:...@host:5432/postgres` |
| — | `NEXT_PUBLIC_SUPABASE_URL`, chaves opcionais |
| — | `DIRECT_URL` (opcional, migrations sem pooler) |

**Não alterar no cutover:** `AUTH_SECRET`, MinIO `S3_*`, Redis, Mercado Pago em `Setting`.

---

## Verificação

```bash
npx --yes prisma@6 validate
npx --yes prisma@6 generate
npm run build
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM "User";'
```

Checklist funcional: ver seção 11 em `docs/MIGRACAO_SUPABASE.md`.

---

## Comandos no VPS/EasyPanel (console app)

Substitua `DATABASE_URL` pela URI Postgres real do Studio (sem commitar senha):

```bash
export DATABASE_URL="postgresql://postgres:SUA_SENHA@supabase.bordadeiras.cloud:5432/postgres"
npx --yes prisma@6 validate
npx --yes prisma@6 generate
npx --yes prisma@6 migrate resolve --applied 20250603130000_postgresql_baseline
npx --yes prisma@6 migrate deploy
npx --yes prisma@6 migrate status
```

Recuperação completa: `sh scripts/easypanel-db-recovery.sh` (com `RUN_DB_SEED=false` no cutover).

---

## Arquivos-chave

- Prisma: `prisma/schema.prisma`, `prisma/migrations/20250603130000_postgresql_baseline/`
- Histórico MySQL: `prisma/migrations/_archive_mysql/`
- DDL Supabase: `supabase/migrations/`
- Dados: `scripts/migrate-mysql-to-postgres.md`
- Deploy: `docker-compose.prod.yml`, `env.production.example`, `scripts/docker-entrypoint.sh`
