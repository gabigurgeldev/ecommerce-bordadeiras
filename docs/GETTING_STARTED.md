# Primeiros passos — Ecommerce Bordadeiras

Guia em português para rodar o projeto localmente no Windows (ou outro SO).

## Requisitos

- **Node.js 20+**
- **PostgreSQL** (Supabase self-hosted, Postgres local ou Docker)
- Opcional: **Docker** para `docker compose up` (Redis; banco via Supabase ou Postgres local)

## 1. Variáveis de ambiente

Na raiz do projeto:

```bash
cp env.example .env
```

Edite o `.env` e configure pelo menos:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Postgres, ex.: `postgresql://postgres:senha@supabase.bordadeiras.cloud:5432/postgres` |
| `AUTH_SECRET` | Segredo do NextAuth — gere com `openssl rand -base64 32` |
| `AUTH_URL` | URL da app, ex.: `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Mesma URL pública da loja |

Opcional: `ADMIN_EMAIL`, `ADMIN_PASSWORD` (usados no seed), chaves Mercado Pago, SMTP, S3, Redis.

## 2. Instalar dependências

```bash
npm install
```

### Problemas no Windows com OneDrive

Se `npm install` falhar com `EPERM`, `ENOTEMPTY` ou `TAR_ENTRY_ERROR`:

1. Pause a sincronização do OneDrive para esta pasta, **ou**
2. Clone/copie o projeto para um caminho fora do OneDrive (ex.: `C:\dev\ecommerce-bordadeiras`), **ou**
3. Exclua `node_modules`, rode `npm cache clean --force` e tente `npm install` de novo.

O projeto usa **npm** (`package-lock.json`). Não há `pnpm-lock.yaml` neste repositório.

## 3. Banco de dados

O schema está em `supabase/migrations/`. Em ambiente novo, aplique essas migrations no Postgres (Studio, `supabase db push` ou MCP) antes de rodar a app.

**Desenvolvimento (rápido):**

```bash
npm run db:push
npm run db:seed
```

**Com migrações versionadas:**

```bash
npm run db:migrate
npm run db:seed
```

Inspecionar dados: `npm run db:studio`

### Produção (EasyPanel / Docker)

No container da loja, após o deploy o **seed roda automaticamente** (admin + dados de exemplo).

Manual no console:

```bash
node prisma/seed.bundle.cjs
```

Ou migrations:

```bash
npx --yes prisma@6 migrate deploy
```

Desativar seed automático no startup: `RUN_DB_SEED=false` no env da app.

## 4. Subir a aplicação

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Painel admin: [http://localhost:3000/admin](http://localhost:3000/admin) (após login com usuário admin).

## 5. Docker (opcional)

Se existir `docker-compose.yml` na raiz:

```bash
docker compose up -d
```

Use o `DATABASE_URL` e `REDIS_URL` apontando para os serviços do compose.

## Credenciais padrão do admin (após seed)

| Campo | Valor padrão (`env.example`) |
|-------|------------------------------|
| E-mail | `admin@bordadeiras.com.br` |
| Senha | `Admin@123456` |

Altere com `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env` **antes** de rodar `npm run db:seed`.

## Verificar build (sem Postgres rodando)

O TypeScript e o build Next não exigem banco ativo, mas o `prisma generate` roda no script `build`:

```bash
npx tsc --noEmit
npm run build
```

## O que só você pode resolver

- **Postgres parado** — migrações, seed e páginas que consultam o banco falham em runtime; o build passa se o schema Prisma for válido.
- **OneDrive** — bloqueios de arquivo em `node_modules` ou `.next`.
- **Chaves de API** — Mercado Pago, SMTP, S3 e WhatsApp para funcionalidades completas em produção.

## Mais documentação

- [README.md](../README.md) — visão geral e scripts
- [docs/ADMIN.md](./ADMIN.md) — painel administrativo
- [docs/INTEGRATIONS.md](./INTEGRATIONS.md) — integrações
- [docs/VPS_SETUP.md](./VPS_SETUP.md) — deploy VPS + EasyPanel (guia completo)
- [docs/DEPLOY.md](./DEPLOY.md) — checklist de deploy
- [docs/ENV_REFERENCE.md](./ENV_REFERENCE.md) — variáveis de ambiente
